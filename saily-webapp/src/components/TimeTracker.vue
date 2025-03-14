<script setup>
import Summary from './Summary.vue';
import { EllipsisHorizontalIcon, PlusCircleIcon, MinusCircleIcon, PencilIcon, ClockIcon } from '@heroicons/vue/20/solid';
import { SuccessToast } from './toasts/SuccessToast';
import { ErrorToast } from './toasts/ErrorToast';
import { writeNewTime, readAllTimes, writeNewGroup, readAllGroups, editTime, endTime, deleteTime, deactivateGroup, reactivateGroup, readWordOfTheDay } from '../firebase/crudFunctions'
import { onMounted, reactive, computed, watch } from 'vue';
import moment from 'moment'
import lodash from 'lodash'
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import { useMainStore } from '../stores/store';

const mainStore = useMainStore();

// state
const state = reactive({
    allGroups: [],
    newGroupName: null,
    newGroupNameError: false,
    newTimeDescription: '',
    newStartTime: {
        hours: mainStore.selectedDate,
        minutes: mainStore.selectedDate,
    },
    newEndTime: {
        hours: mainStore.selectedDate,
        minutes: mainStore.selectedDate,
    },
    wordOfTheDay: null,
});

// computed 
const activeGroups = computed(() => {
    let activeGroups = [];
    let allGroupsCopy = lodash.cloneDeep(state.allGroups);

    activeGroups = allGroupsCopy.filter(group => group.active === true);

    return activeGroups;
});

const inactiveGroups = computed(() => {
    let inactiveGroups = [];
    let allGroupsCopy = lodash.cloneDeep(state.allGroups);

    inactiveGroups = allGroupsCopy.filter(group => group.active === false);

    return inactiveGroups;
});

const onGoingTimes = computed(() => {
    let onGoingTimes = [];
    onGoingTimes = lodash.cloneDeep(mainStore.allTimes).filter(time => time.endTime === null);
    onGoingTimes.forEach((time) => {
        // get its group name
        if (time.groupDocID) {
            time['groupName'] = state.allGroups.find(group => group.docID === time.groupDocID)?.name;
        } else {
            time['groupName'] = 'General';
        }
    });

    return onGoingTimes;
});

onMounted(async () => {
    // get all the times for the logged in user for today
    try {
        mainStore.allTimes = await readAllTimes(localStorage.uid, mainStore.selectedDate);
        const allGroups = await readAllGroups(localStorage.uid);
        state.allGroups = allGroups;
        mainStore.allGroups = allGroups;
        state.wordOfTheDay = await readWordOfTheDay();
    }
    catch (err) {
        console.log(err);
        ErrorToast('An error occurred while trying to load user data.');
    }
});


async function handleStartTime(groupDocID) {
    const selectedDate = mainStore.selectedDate;
    const startYear = selectedDate.getFullYear();
    const startMonth = selectedDate.getMonth() + 1;
    const startDay = selectedDate.getDate();
    const groupName = state.allGroups.find(group => group.docID === groupDocID)?.name;
    const now = new Date();
    const selectedDateWithCurrentTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
    );

    let ongoingTimeExists = false;
    // check if another time is still ongoing
    if (mainStore.allTimes.find(x => x.endTime === null)) {
        ongoingTimeExists = true
    }

    if (!ongoingTimeExists) {
        try {
            let timeDocID = await writeNewTime(localStorage.uid, groupDocID, selectedDate, selectedDateWithCurrentTime);
            mainStore.allTimes.push(
                {
                    startTime: selectedDateWithCurrentTime,
                    endTime: null,
                    groupDocID: groupDocID,
                    uid: localStorage.uid,
                    startYear: startYear,
                    startMonth: startMonth,
                    startDay: startDay,
                    endDay: null,
                    endMonth: null,
                    endYear: null,
                    description: '',
                    docID: timeDocID
                }
            )
            // manually close start task dropdown
            const dropdown = document.getElementById('startTaskDropdown');
            dropdown.removeAttribute('open');

            SuccessToast(`${groupName ? `New task started for ${groupName}` : `New general task started`}`);
        }
        catch (err) {
            console.log(err);
            ErrorToast('An error occurred while trying to start the time');
        }
    }
    else {
        ErrorToast('You must end your current task to start a new one');
    }
}

async function handleEndTime(time) {
    try {
        const selectedDate = mainStore.selectedDate;
        const endYear = selectedDate.getFullYear();
        const endMonth = selectedDate.getMonth() + 1;
        const endDay = selectedDate.getDate();
        const now = new Date();
        const selectedDateWithCurrentTime = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
        );

        await endTime(selectedDate, time.docID, selectedDateWithCurrentTime);
        // update local data
        let allTimesCopy = lodash.cloneDeep(mainStore.allTimes);
        let index = allTimesCopy.findIndex((x) => x.docID === time.docID);

        allTimesCopy[index].endTime = selectedDateWithCurrentTime;
        allTimesCopy[index].endDay = endDay;
        allTimesCopy[index].endMonth = endMonth;
        allTimesCopy[index].endYear = endYear;

        if (state.newEndTime) {
            state.newEndTime.hours = allTimesCopy[index].endTime.getHours();
            state.newEndTime.minutes = allTimesCopy[index].endTime.getMinutes();
        }
        else {
            state.newEndTime = { hours: selectedDateWithCurrentTime.getHours(), minutes: selectedDateWithCurrentTime.getMinutes };
        }

        mainStore.allTimes = allTimesCopy;

        // manually close end task dropdown
        const dropdown = document.getElementById('endTaskDropdown');
        dropdown.removeAttribute('open');

        SuccessToast(`Task ended for ${time.groupName}`);
    }
    catch (err) {
        console.log(err);
        ErrorToast(`An error occurred while trying to end the task for ${time.groupName}`);
    }
}

function calculateTime(time) {
    const selectedDate = mainStore.selectedDate;
    const now = new Date();
    const selectedDateWithCurrentTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
    );
    // calculate the difference in milliseconds
    const timeDifference = (time.endTime ? time.endTime.getTime() : selectedDateWithCurrentTime) - time.startTime.getTime();

    // calculate difference in minutes and hours
    const minutesDifference = Math.floor(timeDifference / (1000 * 60));
    const hoursDifference = Math.floor(minutesDifference / 60);

    let formattedDifference = '';
    if (hoursDifference >= 1) {
        formattedDifference += `${hoursDifference}hr `;
    }
    if (minutesDifference % 60 !== 0 && minutesDifference % 60 !== -1) {
        formattedDifference += `${minutesDifference % 60}mins`;
    }

    return formattedDifference === '' ? '0mins' : formattedDifference;
}

async function handleAddGroup() {
    // validate
    if (!state.newGroupName) {
        state.newGroupNameError = true
    }
    else {
        state.newGroupNameError = false

        // write new group to db and add to local data
        try {
            const currentDate = new Date();
            const newGroupDocID = await writeNewGroup(localStorage.uid, state.newGroupName, currentDate);
            state.allGroups.push(
                {
                    uid: localStorage.uid,
                    name: state.newGroupName,
                    createdDate: currentDate,
                    docID: newGroupDocID,
                    active: true
                }
            )
            SuccessToast(`New time group created: ${state.newGroupName}`);
        }
        catch (err) {
            console.log(err);
            ErrorToast('An error occurred while trying to create a new time group');
        }
    }
}

async function handleDeactivateGroup(group) {
    // update group as not active in db and update local data
    try {
        const currentDate = new Date();
        await deactivateGroup(group.docID);
        const allGroupsCopy = lodash.cloneDeep(state.allGroups);
        const groupIndex = allGroupsCopy.findIndex((x) => x.docID === group.docID);
        allGroupsCopy[groupIndex]['active'] = false;
        allGroupsCopy[groupIndex]['dateDeactivated'] = currentDate;
        state.allGroups = allGroupsCopy;
        SuccessToast(`${group.name} was deactivated`);
    }
    catch (err) {
        console.log(err);
        ErrorToast('An error occurred while trying to deactivate the time group');
    }
}

async function handleReactivateGroup(group) {
    // update group as active in db and update local data
    try {
        await reactivateGroup(group.docID);
        const allGroupsCopy = lodash.cloneDeep(state.allGroups);
        const groupIndex = allGroupsCopy.findIndex((x) => x.docID === group.docID);
        allGroupsCopy[groupIndex]['active'] = true;
        allGroupsCopy[groupIndex]['dateDeactivated'] = null;
        state.allGroups = allGroupsCopy;
        SuccessToast(`${group.name} was reactivated`);
    }
    catch (err) {
        console.log(err);
        ErrorToast('An error occurred while trying to reactivate the time group');
    }
}

function getGroupName(groupDocID) {
    const groupName = state.allGroups.find(group => group.docID === groupDocID)?.name;
    return groupName ? groupName : 'General';
}

async function handleEditTime(time, timeRange) {
    try {
        const startYear = timeRange.startTime.getFullYear();
        const startMonth = timeRange.startTime.getMonth() + 1;
        const startDay = timeRange.startTime.getDate();
        let endYear = null;
        let endMonth = null;
        let endDay = null;

        if (timeRange.endTime) {
            endYear = timeRange.endTime.getFullYear();
            endMonth = timeRange.endTime.getMonth() + 1;
            endDay = timeRange.endTime.getDate();
        }

        await editTime(state.newTimeDescription, timeRange, time.docID);
        time.editTime = false;
        // update local data
        let allTimesCopy = lodash.cloneDeep(mainStore.allTimes);
        let index = allTimesCopy.findIndex((x) => x.docID === time.docID);
        allTimesCopy[index].description = state.newTimeDescription;
        allTimesCopy[index].startTime = timeRange.startTime;
        allTimesCopy[index].startDay = startDay;
        allTimesCopy[index].startMonth = startMonth;
        allTimesCopy[index].startYear = startYear;
        allTimesCopy[index].endTime = timeRange.endTime;
        allTimesCopy[index].endDay = endDay;
        allTimesCopy[index].endMonth = endMonth;
        allTimesCopy[index].endYear = endYear;
        mainStore.allTimes = allTimesCopy;
        SuccessToast(`Task edited successfully`);
    }
    catch (err) {
        console.log(err);
        ErrorToast('An error occurred while trying to edit the task');
    }
}

async function handleDeleteTask(docID) {
    try {
        await deleteTime(docID);
        // update local data
        let allTimesCopy = lodash.cloneDeep(mainStore.allTimes);
        let index = allTimesCopy.findIndex((x) => x.docID === docID);

        allTimesCopy.splice(index, 1);

        mainStore.allTimes = allTimesCopy;

        SuccessToast(`Task deleted`);
    }
    catch (err) {
        console.log(err);
        ErrorToast(`An error occurred while trying to delete the task`);
    }
}

function handleSwitchToEditTime(time) {
    time.editTime = !time.editTime;

    if (time.editTime) {
        // check if another time is in edit mode, if so set it to false
        const editModeTimeIndex = mainStore.allTimes.findIndex((x) => x.editTime === true && x.docID !== time.docID);
        if (editModeTimeIndex !== -1) {
            mainStore.allTimes[editModeTimeIndex].editTime = false;
        }

        // edit mode
        state.newTimeDescription = time.description;
        state.newStartTime.hours = time.startTime.getHours();
        state.newStartTime.minutes = time.startTime.getMinutes();
        if (time.endTime) {
            state.newEndTime = { hours: time.endTime.getHours(), minutes: time.endTime.getMinutes() };
        }
        else {
            state.newEndTime = null;
        }
    }
}

function handleFormatTimeRange(time) {
    const selectedDate = mainStore.selectedDate;
    const now = new Date();
    const selectedDateWithCurrentTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
    );

    let start = new Date(mainStore.selectedDate.setHours(state.newStartTime.hours, state.newStartTime.minutes));
    let end = null;

    if (state.newEndTime) {
        if (typeof state.newEndTime.hours !== 'object') {
            end = new Date(mainStore.selectedDate.setHours(state.newEndTime.hours, state.newEndTime.minutes));
        } else {
            end = new Date(mainStore.selectedDate.setHours(state.newEndTime.hours.getHours(), state.newEndTime.minutes.getMinutes()));
        }
    }

    const timeRange = { startTime: start, endTime: end };

    handleEditTime(time, timeRange);
}

</script>

<template>
    <div class="font-robotoCondensed mt-4 md:mt-12">
        <!-- start and stop buttons -->
        <div class="mb-10 mx-auto">
            <div class="flex justify-center items-center h-12">
                <details class="dropdown" id="startTaskDropdown">
                    <summary class="mr-1 btn w-32 font-bold btn-primary">Start Task</summary>
                    <ul class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li @click="handleStartTime(null)">
                            <a class="flex justify-between items-center p-2">
                                <div>
                                    General
                                </div>
                            </a>
                        </li>
                        <li @click="handleStartTime(group.docID)" v-for="group in activeGroups" :key="group.docID">
                            <a class="flex justify-between items-center p-2">
                                <div>
                                    {{ group.name }}
                                </div>
                                <!-- <EllipsisHorizontalIcon class="w-6 hover:text-emerald-400" /> -->
                            </a>
                        </li>
                        <li onclick="modal_manageGroups.showModal()">
                            <a class="flex justify-center p-2 group">
                                Manage Time Groups
                                <ClockIcon class="w-6 group-hover:text-secondary" />
                            </a>
                        </li>
                    </ul>
                </details>
                <div class="h-full border-l mx-6 start-stop-button-divider"></div>
                <details class="dropdown" id="endTaskDropdown">
                    <summary class="m-1 btn w-32 font-bold btn-primary">End Task</summary>
                    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li v-for="time in onGoingTimes" :key="time.docID" @click="handleEndTime(time)">
                            <a>{{ time.groupName }}</a>
                        </li>
                    </ul>
                </details>
            </div>
        </div>

        <div class="divider px-10">Tasks for {{ moment(mainStore.selectedDate).format('ll') }}</div>

        <!-- daily task timeline -->
        <div v-if="mainStore.allTimes.length > 0" class="md:px-40 pt-3 mb-32">
            <ul class="timeline timeline-snap-icon max-sm:timeline-compact timeline-vertical w-11/12 mx-auto">
                <li v-for="(time, index) in mainStore.allTimes" :key="time.docID">
                    <div class="timeline-middle mx-2">
                        <PencilIcon @click="handleSwitchToEditTime(time)"
                            class="w-4 h-4 hover:text-secondary hover:cursor-pointer transition" />
                    </div>
                    <div
                        :class="`task-timeline ${index % 2 ? 'timeline-end' : 'timeline-start md:text-start'} max-sm:my-8 sm:mb-10 sm:text-sm md:text-md lg:text-md ${!time.editTime ? 'w-12/12' : 'w-12/12'} bg-base-200 rounded-md shadow-md w-full sm:w-72 md:w-80 lg:w-96 p-2`">
                        <time v-if="!time.editTime" class="italic">{{
                            moment(time.startTime).format('LT') }} to {{
                                time.endTime ?
                                    moment(time.endTime).format('LT') : 'ongoing' }} |
                            <span class="font-bold text-accent">{{ calculateTime(time) }}</span>
                        </time>
                        <div v-else class="flex">
                            <div>
                                <VueDatePicker v-model="state.newStartTime" time-picker :is-24="false"
                                    placeholder="Start Time" :clearable="false" />
                            </div>
                            <div>
                                <VueDatePicker v-model="state.newEndTime" time-picker :is-24="false"
                                    placeholder="End Time" />
                            </div>
                        </div>
                        <div class="font-black">{{ getGroupName(time.groupDocID) }}</div>
                        <div class="w-full overflow-hidden">
                            <p class="break-words" v-if="!time.editTime">
                                {{ time.description == '' ? 'Enter task description' : time.description }}
                            </p>
                            <textarea v-else v-model.trim="state.newTimeDescription"
                                class="textarea textarea-ghost w-full" placeholder="Enter task description"></textarea>
                        </div>
                        <div v-if="time.editTime" class="flex">
                            <button @click="handleDeleteTask(time.docID)"
                                class="btn btn-xs btn-error mr-1 transition">Delete
                                Task</button>
                            <button @click="handleFormatTimeRange(time)"
                                class="btn btn-xs btn-secondary transition">Save Changes</button>
                        </div>
                    </div>
                    <hr />
                </li>
            </ul>
        </div>
        <!-- <div class="divider my-5 px-10"></div> -->

        <div v-if="state.wordOfTheDay && mainStore.allTimes.length === 0"
            class="card w-10/12 md:w-7/12 xl:w-6/12 mx-auto bg-base-200 shadow-lg p-4 mb-32 mt-10">
            <div class="card-body">
                <h2 class="font-bold text-center text-xl">
                    Word of the Day
                </h2>
                <p class="font-bold text-xl italic text-accent">
                    {{
                        state.wordOfTheDay.word.charAt(0).toUpperCase() +
                        state.wordOfTheDay.word.slice(1)
                    }}
                </p>
                <div class="w-full mx-auto">
                    <div v-for="(meaning, index) in state.wordOfTheDay.details[0].meanings" :key="index" class="mb-5">
                        <p class="text-sm italic mb-1">{{ meaning.partOfSpeech }}</p>
                        <div v-for="(definition, index) in meaning.definitions" :key="index" class="text-sm">
                            <div class="mb-3">
                                <p>{{ index + 1 }}. {{ definition.definition }}</p>
                                <span class="mt-1 text-gray-500 ml-4" v-if="definition.example">
                                    "{{ definition.example }}"
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>


        <!-- manage groups modal -->
        <dialog id="modal_manageGroups" class="modal">
            <div class="modal-box">
                <h3 class="font-bold text-lg">Manage Time Groups</h3>
                <div class="divider divider-start">Add New Group</div>
                <div class="flex items-center">
                    <input v-model.trim="state.newGroupName" type="text" maxlength="20" placeholder="eg: Mockup Design"
                        :class="`input input-bordered w-full mr-2 ${state.newGroupNameError ? 'input-error' : ''}`" />
                    <PlusCircleIcon @click="handleAddGroup()"
                        class="w-8 h-8 hover:text-secondary hover:cursor-pointer transition" />
                </div>
                <div class="divider divider-start">My Groups</div>
                <div class="collapse mb-2">
                    <input type="checkbox" value="true" />
                    <div class="collapse-title text-sm">
                        <button class="btn btn-xs btn-secondary">View Active Groups</button>
                    </div>
                    <div class="collapse-content">
                        <ul>
                            <li v-for="group in activeGroups" :key="group.docID" class="flex items-center">
                                <MinusCircleIcon @click="handleDeactivateGroup(group)"
                                    class="w-5 h-5 mr-1 hover:text-error hover:cursor-pointer hover:transition" /> {{
                                        group.name
                                    }}
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="collapse">
                    <input type="checkbox" />
                    <div class="collapse-title text-sm">
                        <button class="btn btn-xs btn-secondary">View Deactivated Groups</button>
                    </div>
                    <div class="collapse-content">
                        <ul>
                            <li v-for="group in inactiveGroups" :key="group.docID" class="flex items-center">
                                <PlusCircleIcon @click="handleReactivateGroup(group)"
                                    class="w-5 h-5 mr-1 hover:text-success hover:cursor-pointer hover:transition" /> {{
                                        group.name
                                    }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    </div>
</template>

<style scoped>
.start-stop-button-divider {
    border-color: oklch(var(--bc)/0.3) !important;
}

:where(.timeline hr) {
    --tw-bg-opacity: 1;
    background-color: oklch(var(--bc)/0.3);
}
</style>