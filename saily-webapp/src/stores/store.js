import { ref } from 'vue';
import { defineStore } from 'pinia'

export const useMainStore = defineStore('mainStore', () => {
    // refs
    const selectedDate = ref(new Date());
    const allTimes = ref([]);
    const userSettings = ref(null);
    const uid = ref(null);
    const allGroups = ref([]);
    const pageSelected = ref('home');

    return { selectedDate, allTimes, userSettings, uid, allGroups, pageSelected };
})