<script setup>
import { onMounted, ref } from 'vue';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from './firebase/firebaseConfig';
import MainTitle from './components/MainTitle.vue';
import TimeTracker from './components/TimeTracker.vue';
import Login from './components/Login.vue';
import { SuccessToast } from './components/toasts/SuccessToast';
import { ErrorToast } from './components/toasts/ErrorToast';
import { useMainStore } from './stores/store';

const mainStore = useMainStore();

// refs
const awaitingSignIn = ref(true);



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


</script>

<template>
  <div v-if="mainStore.uid">
    <MainTitle />
    <TimeTracker />
  </div>
  <div v-else>
    <Login />
  </div>
</template>
