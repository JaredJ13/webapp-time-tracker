<script setup>
import { reactive, computed, onMounted, watch } from 'vue';
import moment from 'moment';
import lodash from 'lodash';
import { ClipboardIcon } from '@heroicons/vue/20/solid';
import { SuccessToast } from './toasts/SuccessToast';
import { readTimesForSpecificRange } from '../firebase/crudFunctions';
import { useMainStore } from '../stores/store';

const mainStore = useMainStore();


const props = defineProps(['allGroups']);

const state = reactive({
    summaryDateRange: [new Date(), new Date()],
    timesToSummarize: []
});

// on mount
onMounted(() => {
    state.timesToSummarize = mainStore.allTimes;
    state.formattedTotalHours = '0hrs 0mins';
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
    let generalGroupTotals = { totalTasks: 0, totalHours: 0, hours: 0, minutes: 0, name: 'General', description: '' };

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

    totals.push(generalGroupTotals);

    props.allGroups.forEach((group) => {
        let groupTimes = allTimesCopy.filter((x) => x.groupDocID === group.docID);
        let groupTotals = { totalTasks: 0, totalHours: 0, hours: 0, minutes: 0, name: '', description: '' };

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

watch(() => state.summaryDateRange, async (newRange, oldRange) => {

    // query for tasks from selected calendar date if date selector is changed
    const currentDay = new Date().getDate();
    const currentYear = new Date().getFullYear();

    if (newRange !== oldRange) {
        if (newRange[0] && newRange[1]) {
            if ((newRange[0].getDate() !== currentDay || newRange[0].getFullYear() !== currentYear || newRange[1].getDate() !== currentDay || newRange[1].getFullYear() !== currentYear) || ((newRange[0].getDate() === currentDay || newRange[0].getFullYear() === currentYear || newRange[1].getDate() === currentDay || newRange[1].getFullYear() === currentYear) && (oldRange[0].getDate() !== currentDay || oldRange[0].getFullYear() !== currentYear || oldRange[1].getDate() !== currentDay || oldRange[1].getFullYear() !== currentYear))) {
                state.timesToSummarize = await readTimesForSpecificRange(mainStore.uid, newRange[0], newRange[1]);
            }
        }
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

</script>

<template>
    <div class="font-robotoCondensed mb-6">
        <h2 class="font-bold text-center text-xl md:text-2xl ">Task Summary</h2>

        <!-- date picker -->
        <div class="w-6/12 md:w-4/12 lg:w-3/12 xl:w-2/12 mx-auto mt-5">
            <p class="text-xs">Summarize tasks for:</p>
            <VueDatePicker v-model="state.summaryDateRange" :is-24="false" range :enable-time-picker="false"
                :clearable="false" :format="(date) => datePickerFormat(date)" />
        </div>

        <!-- Total Stats -->
        <h3 class="text-center text-lg font-bold mt-8">All Tasks</h3>
        <div class="flex justify-center items-center">
            <div class="stats sm:stats-horizontal bg-base-200 shadow bg-default">
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
        <div class="w-11/12 md:w-7/12 lg:w-4/12 xl:w-5/12 mx-auto mb-10">
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
                        <p class="whitespace-pre-wrap text-left">{{ total.description }}</p>
                        <button @click="handleCopyToClipboard(total.description)"
                            class="btn btn-secondary text-xs mt-5 mx-auto copy-btn">
                            Copy to Clipboard
                        </button>
                    </div>
                </details>
            </div>
        </div>
        <!--  /Group Stats -->

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