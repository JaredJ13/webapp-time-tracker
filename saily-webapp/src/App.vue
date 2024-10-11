<script setup>
import { onMounted, ref } from 'vue';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from './firebase/firebaseConfig';
import MainTitle from './components/MainTitle.vue';
import TimeTracker from './components/TimeTracker.vue';
import Summary from './components/Summary.vue';
import Login from './components/Login.vue';
import { SuccessToast } from './components/toasts/SuccessToast';
import { ErrorToast } from './components/toasts/ErrorToast';
import { useMainStore } from './stores/store';

const mainStore = useMainStore();

// refs
const awaitingSignIn = ref(true);
const pageSelected = ref('home');



onMounted(() => {
  // Optionally call googleSignIn for sign-in logic
  // googleSignIn().then((result) => {
  //   awaitingSignIn.value = false;
  //   console.log('User signed in:', result);
  // }).catch((error) => {
  //   console.error('Sign-in error:', error);
  // });
});

// function googleSignIn() {
//   return new Promise((resolve, reject) => {
//     const provider = new GoogleAuthProvider();
//     signInWithPopup(auth, provider)
//       .then((result) => {
//         // Handle successful sign-in
//         localStorage.setItem('uid', result.user.uid);
//         SuccessToast(`Signed in as ${result.user.email}`);
//         resolve(result);
//       })
//       .catch((error) => {
//         // Handle errors
//         console.error(error);
//         ErrorToast(error.message);
//         reject(error);
//       });
//   });
// }

function handlePageSelect(page) {
  pageSelected.value = page;
  mainStore.pageSelected = page;
}


</script>

<template>
  <div>
    <div v-if="mainStore.uid">
      <ul
        class="menu bg-base-200 rounded-box w-32 md:w-16 md:h-24 fixed z-50 bottom-1 left-1/2 transform -translate-x-1/2 md:left-4 md:top-1/2 md:transform md:-translate-y-1/2 menu-horizontal md:menu-vertical">
        <li @click="handlePageSelect('home')" :class="`${mainStore.pageSelected === 'home' ? 'disabled' : ''}`">
          <a class="tooltip tooltip-top md:tooltip-right" data-tip="Task Tracker">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </a>
        </li>
        <li @click="handlePageSelect('summary')" :class="`${mainStore.pageSelected === 'summary' ? 'disabled' : ''}`">
          <a class="tooltip tooltip-top md:tooltip-right" data-tip="Task Summary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </a>
        </li>
      </ul>





      <div v-show="pageSelected === 'home'">
        <MainTitle />
        <TimeTracker />
      </div>
      <div v-show="pageSelected !== 'home'">
        <MainTitle />
        <Summary :allGroups="mainStore.allGroups" />
      </div>
    </div>
    <div v-else>
      <Login />
    </div>
  </div>
</template>
