<script setup>
import { reactive, computed } from 'vue';
import { ClipboardIcon } from '@heroicons/vue/20/solid';
import { SuccessToast } from './toasts/SuccessToast';


const props = defineProps(['totalHours', 'totalTasks', 'groupTotals']);

const state = reactive({

});

// computed
const formattedTotalHours = computed(() => {
    let totalHours = Number(props.totalHours);
    let hours = Math.floor(totalHours);
    let minutes = (totalHours - hours) * 60;

    return `${hours}hrs ${minutes.toFixed(0)}mins`;
});

function handleCopyToClipboard(string) {
    navigator.clipboard.writeText(string);
    SuccessToast('Copied to clipboard');
}

</script>

<template>
    <div class="font-robotoCondensed mb-6">
        <h2 class="font-bold text-center text-xl md:text-2xl ">Daily Task Summary</h2>

        <!-- Total Stats -->
        <h3 class="text-center text-lg font-bold mt-8">All Tasks</h3>
        <div class="flex justify-center items-center">
            <div class="stats sm:stats-horizontal bg-base-200 shadow bg-default">
                <div class="stat">
                    <div class="text-center">Total Tasks</div>
                    <div class="stat-value text-center text-accent">{{ totalTasks }}</div>
                    <!-- <div class="stat-desc">↗︎ 400 (22%)</div> -->
                </div>
                <div class="stat">
                    <div class="text-center">Total Hours</div>
                    <div class="stat-value text-accent text-center">{{ totalHours }}</div>
                    <div class="stat-desc text-center">{{ formattedTotalHours }}</div>
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

                            <!-- <div class="stat-desc">↗︎ 400 (22%)</div> -->
                        </div>
                        <div class="stat">
                            <div class="text-center">Hours</div>
                            <div class="stat-value text-center text-accent">{{ total.totalHours.toFixed(2) }}</div>
                            <div class="stat-desc text-center">{{ total.hours }}hrs {{ total.minutes.toFixed(0) }}mins
                            </div>
                        </div>
                    </div>
                </div>
                <details class="collapse collapse-arrow bg-default mt-2 shadow bg-base-200" open>
                    <summary class="collapse-title text-sm text-default font-medium pb-0">Description:</summary>
                    <div class="collapse-content flex flex-col items-center">
                        <p class="whitespace-pre-wrap">{{ total.description }}</p>
                        <button @click="handleCopyToClipboard(total.description)"
                            class="btn btn-secondary text-xs mt-5 copy-btn">
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