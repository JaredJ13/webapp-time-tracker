<script setup>
import { onMounted, reactive, computed, watch, ref } from 'vue';
import { auth } from '../firebase/firebaseConfig';
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { SuccessToast } from './toasts/SuccessToast';
import { ErrorToast } from './toasts/ErrorToast';
import { ArrowLeftEndOnRectangleIcon, StarIcon } from '@heroicons/vue/20/solid';
import VueDatePicker from '@vuepic/vue-datepicker';
// import '@vuepic/vue-datepicker/dist/main.css'
import moment from 'moment';
import { useMainStore } from '../stores/store';
import { editUserSettings, readAllTimes, readUserSettings, writeNewUserSettings, readWordOfTheDay } from '../firebase/crudFunctions';

const mainStore = useMainStore();

// on mount
onMounted(async () => {
    await getUserSettings();
    wordOfTheDay.value = await readWordOfTheDay();
});

// refs
const selectedDayForTasks = ref(new Date());
const appTheme = ref('light');
const wordOfTheDay = ref(null);
const modalWordOfTheDay = ref(false);

// watchers 
watch(selectedDayForTasks, async (newDate, oldDate) => {
    if (newDate !== oldDate) {
        mainStore.selectedDate = newDate;
        mainStore.allTimes = await readAllTimes(localStorage.uid, mainStore.selectedDate);
    }
});

watch(appTheme, async (newTheme, oldTheme) => {
    const uid = localStorage.getItem('uid');
    const container = document.getElementById('appHTML');

    if (newTheme !== oldTheme) {
        // update the user's settings in firestore and in the store
        // check the store to see if the user has a settings doc
        if (mainStore.userSettings) {
            // update the doc
            try {
                await editUserSettings(uid, appTheme.value);
                mainStore.userSettings.theme = appTheme.value;
                // set app theme to the user's selected theme
                container.setAttribute('data-theme', appTheme.value);
            } catch (err) {
                ErrorToast('An error occured while trying to edit the users settings');
                console.log(`An error occured while trying to edit the users settings: ${err}`);
            }
        }
        else {
            // write new doc
            try {
                await writeNewUserSettings(uid, appTheme.value);
                mainStore.userSettings = { uid: uid, theme: appTheme.value };
                // set app theme to the user's selected theme
                container.setAttribute('data-theme', appTheme.value);
            } catch (err) {
                ErrorToast('An error occured while trying to edit the users settings (2)');
                console.log(`An error occured while trying to edit the users settings (2): ${err}`);
            }
        }
        // also store the theme in the user's local storage to apply on the login page
        localStorage.setItem('selectedTheme', appTheme.value);
    }
});

// functions
async function getUserSettings() {
    const uid = localStorage.getItem('uid');
    // look in the userSettings firestore collection to see if this user has a doc
    try {
        let userSettings = null;
        if (uid) {
            userSettings = await readUserSettings(uid);

            if (userSettings) {
                // set them in the store
                mainStore.userSettings = userSettings;

                // now set the user's selected theme dropdown option
                if (userSettings.theme) {
                    appTheme.value = userSettings.theme;
                    // set app theme to the user's selected theme
                    const container = document.getElementById('appHTML');
                    container.setAttribute('data-theme', userSettings.theme);
                    localStorage.setItem('selectedTheme', userSettings.theme);
                }
            }
        } else {
            ErrorToast('No UID available to read user settings');
            console.log('No UID available to read user settings');
        }
    } catch (err) {
        ErrorToast(`An error occurred while trying to read the user settings`);
        console.log(`An error occurred while trying to read the user settings: ${err}`);
    }
}

const datePickerFormat = (selectedDayForTasks) => {
    return moment(selectedDayForTasks).format('ll');
}

async function handleSignOut() {
    try {
        await signOut(auth);
        localStorage.removeItem('uid');
        //return user to login page
        mainStore.uid = null;
    } catch (error) {
        console.error(error);
        ErrorToast(error);
    }
}

function toggleWordOfTheDayModal() {
    modalWordOfTheDay.value = !modalWordOfTheDay.value;
}

</script>

<template>
    <div class="mt-8 relative">
        <div class="theme-and-date-select-div absolute left-10 top-0 cursor-pointer h-5 w-1/6">
            <div v-if="mainStore.pageSelected === 'home'">
                <p class="text-xs">Theme:</p>
                <select v-model="appTheme" class="select select-bordered select-sm w-full max-w-xs mb-2">
                    <option disabled selected>Theme</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="dim">Dim</option>
                    <option value="cupcake">Cupcake</option>
                    <option value="bumblebee">Bumblebee</option>
                    <option value="emerald">Emerald</option>
                    <option value="corporate">Corporate</option>
                    <option value="synthwave">Synthwave</option>
                    <option value="retro">Retro</option>
                    <option value="cyberpunk">Cyberpunk</option>
                    <option value="valentine">Valentine</option>
                    <option value="halloween">Halloween</option>
                    <option value="garden">Garden</option>
                    <option value="forest">Forest</option>
                    <option value="aqua">Aqua</option>
                    <option value="lofi">Lofi</option>
                    <option value="pastel">Pastel</option>
                    <option value="fantasy">Fantasy</option>
                    <option value="wireframe">Wireframe</option>
                    <option value="black">Black</option>
                    <option value="luxury">Luxury</option>
                    <option value="dracula">Dracula</option>
                    <option value="cmyk">CMYK</option>
                    <option value="autumn">Autumn</option>
                    <option value="business">Business</option>
                    <option value="acid">Acid</option>
                    <option value="lemonade">Lemonade</option>
                    <option value="night">Night</option>
                    <option value="coffee">Coffee</option>
                    <option value="winter">Winter</option>
                    <option value="nord">Nord</option>
                    <option value="sunset">Sunset</option>
                </select>
            </div>
            <div v-if="mainStore.pageSelected === 'home'">
                <p class="text-xs">Track tasks for:</p>
                <VueDatePicker class="bg-primary text-primary" v-model="selectedDayForTasks" :is-24="false"
                    :enable-time-picker="false" :clearable="false" :format="datePickerFormat" light />
            </div>
        </div>
        <div class="text-center">
            <h1 class="font-lobster text-5xl">Saily</h1>
            <p class="font-robotoCondensed italic mt-2">Track and Summarize your Daily Tasks</p>
        </div>

        <div class="absolute right-10 top-5 flex">
            <div class="tooltip tooltip-bottom ml-3" data-tip="Word of the Day">
                <div @click="toggleWordOfTheDayModal()"
                    class="cursor-pointer mr-5 hover:text-secondary hover:cursor-pointer transition flex text-sm italic">
                    <StarIcon class="w-5 h-5 ml-1" />
                </div>
            </div>

            <div class="tooltip tooltip-bottom ml-3" data-tip="Sign Out">
                <ArrowLeftEndOnRectangleIcon
                    class="cursor-pointer w-5 h-5 hover:text-error hover:cursor-pointer transition"
                    @click="handleSignOut()" />
            </div>
        </div>

        <div
            class="theme-and-date-select-div-small-viewports cursor-pointer w-12/12 flex-col items-center justify-center mt-4">
            <div v-if="mainStore.pageSelected === 'home'" class="w-40 mb-2">
                <select v-model="appTheme" class="select select-bordered select-sm w-full max-w-xs">
                    <option disabled selected>Theme</option>
                    <option value=" light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="dim">Dim</option>
                    <option value="cupcake">Cupcake</option>
                    <option value="bumblebee">Bumblebee</option>
                    <option value="emerald">Emerald</option>
                    <option value="corporate">Corporate</option>
                    <option value="synthwave">Synthwave</option>
                    <option value="retro">Retro</option>
                    <option value="cyberpunk">Cyberpunk</option>
                    <option value="valentine">Valentine</option>
                    <option value="halloween">Halloween</option>
                    <option value="garden">Garden</option>
                    <option value="forest">Forest</option>
                    <option value="aqua">Aqua</option>
                    <option value="lofi">Lofi</option>
                    <option value="pastel">Pastel</option>
                    <option value="fantasy">Fantasy</option>
                    <option value="wireframe">Wireframe</option>
                    <option value="black">Black</option>
                    <option value="luxury">Luxury</option>
                    <option value="dracula">Dracula</option>
                    <option value="cmyk">CMYK</option>
                    <option value="autumn">Autumn</option>
                    <option value="business">Business</option>
                    <option value="acid">Acid</option>
                    <option value="lemonade">Lemonade</option>
                    <option value="night">Night</option>
                    <option value="coffee">Coffee</option>
                    <option value="winter">Winter</option>
                    <option value="nord">Nord</option>
                    <option value="sunset">Sunset</option>
                </select>
            </div>
            <div v-if="mainStore.pageSelected === 'home'" class="w-40">
                <!-- <p class="text-xs">Track tasks for:</p> -->
                <VueDatePicker class="bg-primary text-primary" v-model="selectedDayForTasks" :is-24="false"
                    :enable-time-picker="false" :clearable="false" :format="datePickerFormat" light />
            </div>
        </div>

        <dialog class="modal" :class="{ 'modal-open': modalWordOfTheDay }">
            <div v-if="wordOfTheDay" class="modal-box">
                <p class="font-bold text-center text-lg ">
                    Word of the Day
                </p>
                <p class="font-bold text-xl italic text-accent">
                    {{
                        wordOfTheDay.word.charAt(0).toUpperCase() +
                        wordOfTheDay.word.slice(1)
                    }}
                </p>
                <div class="w-full mx-auto">
                    <div v-for="(meaning, index) in wordOfTheDay.details[0].meanings" :key="index" class="mb-5">
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
            <form method="dialog" class="modal-backdrop" @click="toggleWordOfTheDayModal()">
                <button>close</button>
            </form>
        </dialog>
    </div>
</template>

<style>
/* Customize date picker to use theme colors and look like daisy ui select*/
.dp__theme_light {
    --dp-background-color: oklch(var(--b1)) !important;
    --dp-highlight-color: oklch(var(--s)) !important;
    --dp-primary-color: oklch(var(--s)) !important;
    --dp-text-color: oklch(var(--bc)) !important;
}

.dp__input {
    background-color: var(--dp-background-color);
    border-radius: var(--rounded-btn, 0.5rem) !important;
    border: 1px solid oklch(var(--bc) / 0.2) !important;
    font-size: 0.875rem !important;
}

.bg-primary {
    background: none !important;
}

.dp__main {
    font-family: 'Lobster', 'sans-serif' !important;
}

/* Remove focused outline from daisyui select*/
.select:focus {
    outline: none !important;
}

/* Change height of daisy ui select to match height of date picker*/
.theme-and-date-select-div-small-viewports .select-md {
    height: 2.4rem !important;
    min-height: 0 !important;
}
</style>