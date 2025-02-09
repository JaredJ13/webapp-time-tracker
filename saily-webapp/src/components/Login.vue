<script setup>
import { ref, onMounted } from 'vue';
import { auth } from '../firebase/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { SuccessToast } from './toasts/SuccessToast';
import { ErrorToast } from './toasts/ErrorToast';
import { useMainStore } from '../stores/store';

const mainStore = useMainStore();

// refs
const email = ref(null);
const password = ref(null);
const newEmail = ref(null);
const newPassword = ref(null);
const newPasswordConfirm = ref(null);

// on mount
onMounted(() => {
    const container = document.getElementById('appHTML');
    // check if the user has a theme stored in local storage
    const selectedTheme = localStorage.getItem('selectedTheme');
    container.setAttribute('data-theme', selectedTheme ? selectedTheme : 'light');
})

// functions
async function handleSignIn() {
    let validInput = true;

    if (!email.value || email.value == '') {
        validInput = false;
        return;
    }

    if (!password.value || password.value == '') {
        validInput = false;
        return;
    }

    if (validInput) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
            localStorage.setItem('uid', userCredential.user.uid);
            mainStore.uid = userCredential.user.uid;
            SuccessToast(`Signed in as ${userCredential.user.email}`);
            console.log("User signed in: ", userCredential);
        } catch (err) {
            ErrorToast(`Error signing in: ${err}`);
            console.error("Error signing in: ", err);
        }
    }
}

async function handleSignUp() {
    let validInput = true;

    // Check if email and password fields are filled
    if (!newEmail.value || newEmail.value == '') {
        validInput = false;
        ErrorToast("Email is required.");
        return;
    }

    if (!newPassword.value || newPassword.value == '') {
        validInput = false;
        ErrorToast("Password is required.");
        return;
    }

    if (!newPasswordConfirm.value || newPasswordConfirm.value == '') {
        validInput = false;
        ErrorToast("Password confirmation is required.");
        return;
    }

    // Check if password and confirm password match
    if (newPassword.value !== newPasswordConfirm.value) {
        validInput = false;
        ErrorToast("Passwords do not match.");
        return;
    }

    if (validInput) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, newEmail.value, newPassword.value);
            localStorage.setItem('uid', userCredential.user.uid);
            mainStore.uid = userCredential.user.uid;
            SuccessToast(`Account created for ${userCredential.user.email}`);
            console.log("User signed up: ", userCredential);
        } catch (err) {
            ErrorToast(`Error signing up: ${err.message}`);
            console.error("Error signing up: ", err);
        }
    }
}

// function googleSignIn() {
//     return new Promise((resolve, reject) => {
//         const provider = new GoogleAuthProvider();
//         // Add the prompt to force account selection
//         provider.setCustomParameters({
//             prompt: 'select_account'
//         });
//         signInWithPopup(auth, provider)
//             .then(async (result) => {
//                 // Handle successful sign-in
//                 localStorage.setItem('uid', result.user.uid);
//                 mainStore.uid = result.user.uid;
//                 SuccessToast(`Signed in as ${result.user.email}`);
//                 resolve(result);
//             })
//             .catch((error) => {
//                 // Handle errors
//                 console.error(error);
//                 ErrorToast(error.message);
//                 reject(error);
//             });
//     });
// }


</script>

<template>
    <div>
        <div class="mt-32 w-12/12 mx-auto">
            <div class="text-center mb-10">
                <h1 class="font-lobster text-5xl">Saily</h1>
                <p class="font-robotoCondensed italic mt-2">Track and Summarize your Daily Tasks</p>
            </div>
            <!-- <div class="flex justify-center">
                <button @click="googleSignIn()" className="btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="-3 0 262 262"
                        preserveAspectRatio="xMidYMid">
                        <path
                            d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                            fill="#4285F4" />
                        <path
                            d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                            fill="#34A853" />
                        <path
                            d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                            fill="#FBBC05" />
                        <path
                            d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                            fill="#EB4335" />
                    </svg>
                    Sign Up or Login with Google
                </button>
            </div>  -->
            <form @submit.prevent="handleSignIn()" class="w-9/12 sm:w-7/12 md:w-4/12 lg:w-3/12 mx-auto">
                <h2 class="text-xl text-center mb-2">Login</h2>
                <label class="input input-bordered flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                        class="h-4 w-4 opacity-70">
                        <path
                            d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                        <path
                            d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                    </svg>
                    <input v-model.trim="email" type="text" class="grow" placeholder="Email" autocomplete="email" />
                </label>
                <label class="input input-bordered flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                        class="h-4 w-4 opacity-70">
                        <path fill-rule="evenodd"
                            d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                            clip-rule="evenodd" />
                    </svg>
                    <input v-model.trim="password" type="password" class="grow" placeholder="Password"
                        autocomplete="password" />
                </label>
                <div class="flex justify-end">
                    <button type="submit" class="btn btn-md btn-primary">Login</button>
                </div>
                <div className="divider my-12">OR</div>
            </form>
            <form @submit.prevent="handleSignUp()" class="w-9/12 sm:w-7/12 md:w-4/12 lg:w-3/12 mx-auto">
                <h2 class="text-xl text-center mb-2">Sign Up for a Free Account</h2>
                <label class="input input-bordered flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                        class="h-4 w-4 opacity-70">
                        <path
                            d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                        <path
                            d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                    </svg>
                    <input v-model.trim="newEmail" type="text" class="grow" placeholder="Email" autocomplete="email" />
                </label>
                <label class="input input-bordered flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                        class="h-4 w-4 opacity-70">
                        <path fill-rule="evenodd"
                            d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                            clip-rule="evenodd" />
                    </svg>
                    <input v-model.trim="newPassword" type="password" class="grow" placeholder="Password"
                        autocomplete="password" />
                </label>
                <label class="input input-bordered flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                        class="h-4 w-4 opacity-70">
                        <path fill-rule="evenodd"
                            d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                            clip-rule="evenodd" />
                    </svg>
                    <input v-model.trim="newPasswordConfirm" type="password" class="grow"
                        placeholder="Confirm Password" />
                </label>
                <div class="flex justify-end mb-20">
                    <button type="submit" class="btn btn-md btn-primary">Sign Up</button>
                </div>
            </form>

        </div>
    </div>
</template>

<style></style>