<script setup>
import { reactive, computed, onMounted, watch, ref } from 'vue';
import moment from 'moment';
import lodash from 'lodash';
import { BoltIcon, QuestionMarkCircleIcon, QueueListIcon } from '@heroicons/vue/20/solid';
import { SuccessToast } from './toasts/SuccessToast';
import { readAllAiSummaries, readTimesForSpecificRange, writeNewAiSummary } from '../firebase/crudFunctions';
import { useMainStore } from '../stores/store';
import { ErrorToast } from './toasts/ErrorToast';

const mainStore = useMainStore();


const props = defineProps(['allGroups']);

const state = reactive({
    summaryDateRange: [new Date(), new Date()],
    timesToSummarize: [],
    summary: '',
    error: '',
    usersSavedSummaries: [],
    generateAiSummaryLoading: false,
    showTimeDetailsInSummary: false,
});

// on mount
onMounted(async () => {
    state.timesToSummarize = mainStore.allTimes;
    state.formattedTotalHours = '0hrs 0mins';
    state.timesToSummarize = await readTimesForSpecificRange(mainStore.uid, new Date(), new Date());
    state.usersSavedSummaries = await readAllAiSummaries(localStorage.uid);
});

// computed
const totalHours = computed(() => {
    let total = 0;

    if (state.timesToSummarize) {
        state.timesToSummarize.forEach((time) => {
            const { startTime, endTime } = time;

            if (startTime && endTime) {
                const start = new Date(startTime);
                const end = new Date(endTime);

                // Calculate the difference in milliseconds
                const diff = end - start;

                // Convert milliseconds to hours
                const hours = diff / (1000 * 60 * 60);

                // Add to the total
                total += hours;
            } else if (startTime && !endTime) {
                const start = new Date(startTime);
                const selectedDate = mainStore.selectedDate;
                const currentDate = new Date();
                const now = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate(),
                    currentDate.getHours(),
                    currentDate.getMinutes(),
                    currentDate.getSeconds()
                );

                // Calculate the difference in milliseconds
                const diff = now - start;

                // Convert milliseconds to hours
                const hours = diff / (1000 * 60 * 60);

                // Add to the total
                total += hours;
            }
        });
    }
    // format and set total hours
    let totalHours = Number(total);
    let hours = Math.floor(totalHours);
    let minutes = (totalHours - hours) * 60;

    state.formattedTotalHours = `${hours}hrs ${minutes.toFixed(0)}mins`;

    // Return the total rounded to two decimal places
    return total.toFixed(2);
});

const groupTotals = computed(() => {
    let totals = [];

    let allTimesCopy = lodash.cloneDeep(state.timesToSummarize);

    // get General group totals
    let generalGroupTimes = allTimesCopy.filter((x) => x.groupDocID === null);
    let generalGroupTotals = { totalTasks: 0, totalHours: 0, hours: 0, minutes: 0, name: 'General', description: '', dateOrganizedTimes: [], dateOrganizedDescription: '' };

    // if show time details enabled, group times by month and day
    if (state.showTimeDetailsInSummary) {
        let groupedTimes = {};
        // group by unique day, month, and year
        generalGroupTimes.forEach(timeObj => {
            // extract the unique date (YYYY-MM-DD)
            const dateKey = new Date(timeObj.startTime).toISOString().split('T')[0];

            // initialize the array if not present
            if (!groupedTimes[dateKey]) {
                groupedTimes[dateKey] = {
                    date: dateKey,
                    times: []
                };
            }

            // add the time object to the correct group
            groupedTimes[dateKey].times.push(timeObj);
        });

        // convert groupedTimes object to an array
        generalGroupTotals.dateOrganizedTimes = Object.values(groupedTimes);

        // generate description
        generalGroupTotals.dateOrganizedTimes.forEach((dateGroup) => {
            generalGroupTotals.dateOrganizedDescription += `${moment(dateGroup.date).format('ll')}\n`;
            dateGroup.times.forEach((time, index) => {
                if (index === dateGroup.times.length - 1) {
                    generalGroupTotals.dateOrganizedDescription += `${moment(time.startTime).format('LT')} to ${time.endTime ? moment(time.endTime).format('LT') : 'Ongoing'}\n- ${time.description.trim() !== '' ? time.description : 'No description provided'}\n\n`;
                } else {
                    generalGroupTotals.dateOrganizedDescription += `${moment(time.startTime).format('LT')} to ${time.endTime ? moment(time.endTime).format('LT') : 'Ongoing'}\n- ${time.description.trim() !== '' ? time.description : 'No description provided'}\n`;
                }
            })
        })
    }

    generalGroupTimes.forEach((time) => {
        if (time.description.trim() !== '') {
            generalGroupTotals.description += `- ${time.description}\n`;
        }

        generalGroupTotals.totalTasks += 1;

        const { startTime, endTime } = time;

        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);

            // Calculate the difference in milliseconds
            const diff = end - start;

            // Convert milliseconds to hours
            const hours = diff / (1000 * 60 * 60);

            // Add to the total
            generalGroupTotals.totalHours += hours;
        } else if (startTime && !endTime) {
            const start = new Date(startTime);
            const selectedDate = mainStore.selectedDate;
            const currentDate = new Date();
            const now = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate(),
                currentDate.getHours(),
                currentDate.getMinutes(),
                currentDate.getSeconds()
            );

            // Calculate the difference in milliseconds
            const diff = now - start;

            // Convert milliseconds to hours
            const hours = diff / (1000 * 60 * 60);

            // Add to the total
            generalGroupTotals.totalHours += hours;
        }
    });

    generalGroupTotals.hours = Math.floor(generalGroupTotals.totalHours);
    generalGroupTotals.minutes = (generalGroupTotals.totalHours - generalGroupTotals.hours) * 60;

    if (generalGroupTotals.totalTasks > 0) {
        totals.push(generalGroupTotals);
    }

    props.allGroups.forEach((group) => {
        let groupTimes = allTimesCopy.filter((x) => x.groupDocID === group.docID);
        let groupTotals = { totalTasks: 0, totalHours: 0, hours: 0, minutes: 0, name: '', description: '', dateOrganizedTimes: [], dateOrganizedDescription: '' };

        // if show time details enabled, group times by month and day
        if (state.showTimeDetailsInSummary) {
            let groupedTimes = {};
            // group by unique day, month, and year
            groupTimes.forEach(timeObj => {
                // extract the unique date (YYYY-MM-DD)
                const dateKey = new Date(timeObj.startTime).toISOString().split('T')[0];

                // initialize the array if not present
                if (!groupedTimes[dateKey]) {
                    groupedTimes[dateKey] = {
                        date: dateKey,
                        times: []
                    };
                }

                // add the time object to the correct group
                groupedTimes[dateKey].times.push(timeObj);
            });

            // convert groupedTimes object to an array
            groupTotals.dateOrganizedTimes = Object.values(groupedTimes);

            // generate description
            groupTotals.dateOrganizedTimes.forEach((dateGroup) => {
                groupTotals.dateOrganizedDescription += `${moment(dateGroup.date).format('ll')}\n`;
                dateGroup.times.forEach((time, index) => {
                    if (index === dateGroup.times.length - 1) {
                        groupTotals.dateOrganizedDescription += `${moment(time.startTime).format('LT')} to ${time.endTime ? moment(time.endTime).format('LT') : 'Ongoing'}\n- ${time.description.trim() !== '' ? time.description : 'No description provided'}\n\n`;
                    } else {
                        groupTotals.dateOrganizedDescription += `${moment(time.startTime).format('LT')} to ${time.endTime ? moment(time.endTime).format('LT') : 'Ongoing'}\n- ${time.description.trim() !== '' ? time.description : 'No description provided'}\n`;
                    }
                })
            })
        }

        groupTimes.forEach((time) => {
            if (time.description.trim() !== '') {
                groupTotals.description += `- ${time.description}\n`;
            }
            groupTotals.totalTasks += 1;

            const { startTime, endTime } = time;

            if (startTime && endTime) {
                const start = new Date(startTime);
                const end = new Date(endTime);

                // Calculate the difference in milliseconds
                const diff = end - start;

                // Convert milliseconds to hours
                const hours = diff / (1000 * 60 * 60);

                // Add to the total
                groupTotals.totalHours += hours;
            } else if (startTime && !endTime) {
                const start = new Date(startTime);
                const selectedDate = mainStore.selectedDate;
                const currentDate = new Date();
                const now = new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate(),
                    currentDate.getHours(),
                    currentDate.getMinutes(),
                    currentDate.getSeconds()
                );

                // Calculate the difference in milliseconds
                const diff = now - start;

                // Convert milliseconds to hours
                const hours = diff / (1000 * 60 * 60);

                // Add to the total
                groupTotals.totalHours += hours;
            }
        });

        groupTotals.hours = Math.floor(groupTotals.totalHours);
        groupTotals.minutes = (groupTotals.totalHours - groupTotals.hours) * 60;
        groupTotals.name = getGroupName(group.docID);

        if (groupTotals.totalTasks !== 0) {
            totals.push(groupTotals);
        }
    });

    return totals
});

const summaryText = computed(() => {
    const dateRange = state.summaryDateRange;

    // case when only the first date is selected
    if (dateRange[0] && !dateRange[1]) {
        return moment(dateRange[0]).format('ll');
    }

    // case when only the second date is selected
    if (dateRange[1] && !dateRange[0]) {
        return moment(dateRange[1]).format('ll');
    }

    // case when both dates are selected and they are not the same day or year
    if (dateRange[0] && dateRange[1] &&
        (!moment(dateRange[0]).isSame(dateRange[1], 'day') ||
            !moment(dateRange[0]).isSame(dateRange[1], 'year'))) {
        return moment(dateRange[0]).format('ll') + ' to ' + moment(dateRange[1]).format('ll');
    }

    // fallback case if both dates are the same
    return moment(dateRange[0] || dateRange[1]).format('ll');
});

watch(() => state.summaryDateRange, async (newRange, oldRange) => {
    // query for tasks from selected calendar date if date selector is changed
    if (newRange[0] && newRange[1]) {
        state.timesToSummarize = await readTimesForSpecificRange(mainStore.uid, newRange[0], newRange[1]);
    }
    else if (newRange[0] && !newRange[1]) {
        state.timesToSummarize = await readTimesForSpecificRange(mainStore.uid, newRange[0], newRange[0]);
    }
    else if (!newRange[0] && newRange[1]) {
        state.timesToSummarize = await readTimesForSpecificRange(mainStore.uid, newRange[1], newRange[1]);
    }
});

function handleCopyToClipboard(string) {
    navigator.clipboard.writeText(string);
    SuccessToast('Copied to clipboard');
}

function datePickerFormat(selectedRangeForTasks) {
    if (Array.isArray(selectedRangeForTasks)) {
        return selectedRangeForTasks
            .map(date => moment(date).format('ll'))
            .join(' - ');
    }
    return '';
}

function getGroupName(groupDocID) {
    const groupName = props.allGroups.find(group => group.docID === groupDocID)?.name;
    return groupName ? groupName : 'General';
}

async function refreshSummary() {
    if (state.summaryDateRange[0] && state.summaryDateRange[1]) {
        state.timesToSummarize = await readTimesForSpecificRange(mainStore.uid, state.summaryDateRange[0], state.summaryDateRange[1]);
    }
    else if (state.summaryDateRange[0] && !state.summaryDateRange[1]) {
        state.timesToSummarize = await readTimesForSpecificRange(mainStore.uid, state.summaryDateRange[0], state.summaryDateRange[0]);
    }
    else if (!state.summaryDateRange[0] && state.summaryDateRange[1]) {
        state.timesToSummarize = await readTimesForSpecificRange(mainStore.uid, state.summaryDateRange[1], state.summaryDateRange[1]);
    }
}

async function callSummarizeTasks() {
    state.generateAiSummaryLoading = true;
    state.error = '';
    let tasks = [];

    // go through computed groupTotals and make array of task groups including time spent on task group and num of tasks
    groupTotals.value.forEach((group) => {
        let groupTaskString = `(Task Group: ${group.name}, Num of Tasks: ${group.totalTasks}, time spent on group tasks: ${group.hours.toFixed(2)}hrs ${group.minutes.toFixed(2)}mins, tasks: ${group.description})`;

        tasks.push(groupTaskString);
    });

    try {
        console.log("Tasks to be sent:", tasks);

        const response = await fetch('https://summarizetasks-ihya7p3uuq-uc.a.run.app/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tasks: tasks }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error: ${response.status} - ${response.statusText}: ${errorText}`);
        }

        const data = await response.json();
        state.summary = data.summary;
        console.log(state.summary);
        SuccessToast(`AI summary generated`);

        // write ai summary to db and add to local data
        try {
            const newGroupDocID = await writeNewAiSummary(localStorage.uid, state.summary, state.summaryDateRange[0], state.summaryDateRange[1], summaryText.value);
            state.usersSavedSummaries.unshift(
                {
                    uid: localStorage.uid,
                    summary: state.summary,
                    createdDate: new Date(),
                    docID: newGroupDocID,
                    startDate: state.summaryDateRange[0],
                    endDate: state.summaryDateRange[1],
                    summaryDateRange: summaryText.value
                }
            )
            SuccessToast(`AI summary has been saved to your account`);
        }
        catch (err) {
            console.log(err);
            ErrorToast('An error occurred while trying to save the AI summary to your account');
        }
    } catch (err) {
        console.error("Error calling AI summary function: ", err);
        ErrorToast("Error calling AI summary function: ", err);
        state.error = err.message;
    } finally {
        state.generateAiSummaryLoading = false;
    }
};

</script>

<template>
    <div class="font-robotoCondensed mb-4 mt-0 md:mt-10">
        <!-- date picker -->
        <div class="w-7/12 md:w-4/12 lg:w-3/12 xl:w-2/12 mx-auto mt-5">
            <p class="text-xs">Summarize tasks for:</p>
            <VueDatePicker v-model="state.summaryDateRange" :is-24="false" range :enable-time-picker="false"
                :clearable="false" :format="(date) => datePickerFormat(date)" />
        </div>
        <div class="w-40 mx-auto mt-3">
            <button class="btn btn-primary text-sm w-full" @click="refreshSummary()">
                Refresh Summary
            </button>
            <button class="card-stats-view btn btn-outline btn-sm btn-primary mt-4 w-full"
                @click="callSummarizeTasks()">
                <p v-if="!state.generateAiSummaryLoading">Generate AI Summary</p>
                <BoltIcon v-else class="w-4 h-4 animate-spin" />
            </button>
            <button class="card-stats-view btn btn-outline btn-sm btn-primary mt-4 w-full"
                onclick="savedSummaries_modal.showModal()">
                My AI Summaries
            </button>
            <div class="flex mt-4 card-stats-view card-stats-view-show-details-switch-container">
                <label class="mr-1 text-xs pt-1" for="showTimeDetails_switch">Show Time Details</label>
                <input type="checkbox" checked="checked" class="toggle toggle-primary"
                    v-model="state.showTimeDetailsInSummary" id="showTimeDetails_switch" />
            </div>
        </div>

        <div class="divider mt-16 px-10">Summary for {{ summaryText }}</div>


        <!-- Total Stats -->
        <h3 class="text-center text-lg font-bold mt-6">All Tasks</h3>
        <div class="flex justify-center items-center">
            <div class="stats sm:stats-horizontal bg-base-200 shadow-lg bg-default">
                <div class="stat">
                    <div class="text-center">Total Tasks</div>
                    <div class="stat-value text-center text-accent">{{ state.timesToSummarize.length }}</div>
                    <!-- <div class="stat-desc">↗︎ 400 (22%)</div> -->
                </div>
                <div class="stat">
                    <div class="text-center">Total Hours</div>
                    <div class="stat-value text-accent text-center">{{ totalHours }}</div>
                    <div class="stat-desc text-center">{{ state.formattedTotalHours }}</div>
                </div>
            </div>
        </div>
        <!--  Group Stats -->
        <div class="table-stats-view card bg-base-200 w-11/12 lg:w-10/12 xl:w-9/12 mx-auto mt-4 mb-20 shadow-xl">
            <div class="flex justify-end items-center pt-8 pr-20">
                <button onclick="savedSummaries_modal.showModal()" class="btn btn-outline btn-sm btn-primary mr-2">View
                    My AI
                    Summaries
                    <QueueListIcon class="w-4 h-4 mx-auto" />
                </button>
                <button @click="callSummarizeTasks()" class="btn btn-outline btn-sm btn-primary">Generate AI Summary
                    <BoltIcon :class="{ 'animate-spin': state.generateAiSummaryLoading }" class="w-4 h-4 mx-auto" />
                </button>
                <div class="tooltip tooltip-left ml-3"
                    data-tip="This will create an AI-generated summary of all the tasks in the table. It will remove repeated items and emphasize creating a concise, professional summary with a focus on key achievements throughout the time period. Your summary will be automatically saved to your account. This won't affect any of the tasks/times in the table below.">
                    <QuestionMarkCircleIcon class="w-5 h-5" />
                </div>
            </div>
            <div class="flex justify-end pt-8 pr-20">
                <label class="mr-2" for="showTimeDetails_switch">Show Time Details</label>
                <input type="checkbox" checked="checked" class="toggle toggle-primary"
                    v-model="state.showTimeDetailsInSummary" id="showTimeDetails_switch" />
            </div>
            <div class="card-body">
                <div class="overflow-x-auto w-11/12 mx-auto mt-4 mb-20">
                    <table class="table">
                        <thead>
                            <tr class="border-b-2  border-accent">
                                <th></th>
                                <th class="text-lg">Time Group</th>
                                <th class="text-lg">Total Tasks</th>
                                <th class="text-lg">Total Hours</th>
                                <th class="text-lg">Description <span class="italic">(Click cell to copy)</span></th>
                                <!-- <th class="text-lg">AI Summary</th> -->
                            </tr>
                        </thead>
                        <tbody v-for="(total, index) in groupTotals" :key="index">
                            <th class="border-b-2 border-accent">{{ index + 1 }}</th>
                            <td class="border-b-2 border-accent">{{ total.name }}</td>
                            <td class="border-b-2 border-accent">{{ total.totalTasks }}</td>
                            <td class="border-b-2 border-accent">{{ total.totalHours.toFixed(2) }}</td>
                            <td v-if="!state.showTimeDetailsInSummary"
                                class="border-b-2 border-accent w-5/12 whitespace-pre-wrap text-left hover:cursor-pointer hover:text-success transition"
                                @click="handleCopyToClipboard(total.description)">
                                {{ total.description }}
                            </td>
                            <td v-else
                                class="border-b-2 border-accent w-5/12 text-left hover:cursor-pointer hover:text-success transition"
                                @click="handleCopyToClipboard(total.dateOrganizedDescription)">
                                <div v-for="(dateGroup, dateGroupIndex) in total.dateOrganizedTimes"
                                    :key="dateGroupIndex">
                                    <p class="font-bold mb-1">{{ moment(dateGroup.date).format('ll') }}</p>
                                    <div class="mb-4">
                                        <div v-for="(dateGroupTime, dateGroupTimeIndex) in dateGroup.times"
                                            :key="dateGroupTimeIndex">
                                            <p class="mb-1 italic">{{
                                                `${moment(dateGroupTime.startTime).format('LT')} to
                                                ${dateGroupTime.endTime ? moment(dateGroupTime.endTime).format('LT') :
                                                    'Ongoing'}` }}</p>
                                            <p class="mb-3"
                                                v-html="`- ${dateGroupTime.description.trim() !== '' ? dateGroupTime.description.replace(/\s-\s|\s-|- /g, '<br>- ') : 'No description provided'}`">
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <!-- <td class="border-b-2 border-accent hover:cursor-pointer hover:text-success transition">
                                <BoltIcon class="w-4 h-4 mx-auto" />
                            </td> -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="card-stats-view w-11/12 md:w-7/12 lg:w-4/12 xl:w-5/12 mx-auto mb-10">
            <div v-for="(total, index) in groupTotals" :key="index">
                <h3 class="text-center text-lg font-bold mt-8 ">{{ total.name }}</h3>
                <div class="flex justify-center items-center">
                    <div class="stats w-80 sm:stats-horizontal bg-base-200 shadow mt-1 bg-default">
                        <div class="stat">
                            <div class="text-center">Tasks</div>
                            <div class="stat-value text-center text-accent">{{ total.totalTasks }}</div>
                        </div>
                        <div class="stat">
                            <div class="text-center">Hours</div>
                            <div class="stat-value text-center text-accent">{{ total.totalHours.toFixed(2) }}</div>
                            <div class="stat-desc text-center">{{ total.hours }}hrs {{ total.minutes.toFixed(0) }}mins
                            </div>
                        </div>
                    </div>
                </div>
                <details class="collapse collapse-arrow bg-default mt-2 shadow bg-base-200"
                    :open="total.description && total.description.trim() !== '' ? true : null">
                    <summary class="collapse-title text-sm text-default font-medium pb-0">Description</summary>
                    <div class="collapse-content flex flex-col">
                        <p v-if="!state.showTimeDetailsInSummary" class="whitespace-pre-wrap text-left">{{
                            total.description }}</p>
                        <td v-else class="text-left transition">
                            <div v-for="(dateGroup, dateGroupIndex) in total.dateOrganizedTimes" :key="dateGroupIndex">
                                <p class="font-bold mb-1">{{ moment(dateGroup.date).format('ll') }}</p>
                                <div class="mb-4">
                                    <div v-for="(dateGroupTime, dateGroupTimeIndex) in dateGroup.times"
                                        :key="dateGroupTimeIndex">
                                        <p class="mb-1 italic">{{
                                            `${moment(dateGroupTime.startTime).format('LT')} to
                                            ${dateGroupTime.endTime ? moment(dateGroupTime.endTime).format('LT') :
                                                'Ongoing'}` }}</p>
                                        <p class="mb-3"
                                            v-html="`- ${dateGroupTime.description.trim() !== '' ? dateGroupTime.description.replace(/\s-\s|\s-|- /g, '<br>- ') : 'No description provided'}`">
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </td>
                        <button
                            @click="handleCopyToClipboard(!state.showTimeDetailsInSummary ? total.description : total.dateOrganizedDescription)"
                            class="btn btn-secondary text-xs mt-5 mx-auto copy-btn">
                            Copy to Clipboard
                        </button>
                    </div>
                </details>
            </div>
        </div>
        <!--  /Group Stats -->

        <!-- Saved Summaries Modal -->
        <dialog id="savedSummaries_modal" class="modal">
            <div class="modal-box">
                <div v-if="state.usersSavedSummaries.length > 0">
                    <h1 class="font-bold text-xl mb-4">Saved AI Summaries</h1>
                    <div class="divider"></div>
                    <div v-for="(summary, index) in state.usersSavedSummaries" :key="index"
                        class="card bg-base-200 w-11/12 mx-auto shadow-xl mb-10">
                        <div class="card-body">
                            <h2 class="card-title">Summary for {{ summary.summaryDateRange }}</h2>
                            <h3 class="text-md">Created {{ moment(summary.dateCreated).format('lll') }}</h3>
                            <p class="text-sm">{{ summary.summary }}</p>
                        </div>
                    </div>
                </div>
                <div v-else>
                    <h1 class="font-bold text-xl">Saved AI Summaries</h1>
                    <h2>You have no saved AI summaries</h2>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
        <!-- /Saved Summaries Modal -->

    </div>
</template>

<style scoped>
.copy-btn {
    min-height: 0px !important;
    height: 1.5rem !important;
    padding: 0 !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
}
</style>