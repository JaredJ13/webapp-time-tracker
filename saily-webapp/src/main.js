import './style.css'
import { createApp } from 'vue'
import App from './App.vue'
import Toast, { useToast } from "vue-toastification"; // Added useToast for dynamic toast notifications
import "vue-toastification/dist/index.css";
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { createPinia } from 'pinia';

const pinia = createPinia();
const app = createApp(App);

// Use Pinia
app.use(pinia);

// Configure and use Toastification
app.use(Toast, {
    transition: 'Vue-Toastification__fade',
    maxToasts: 5,
    newestOnTop: true
});

// Register VueDatePicker globally
app.component('VueDatePicker', VueDatePicker);

// Create toast instances for notifications
const toast = useToast();

// Mount the app immediately (better UX, app loads even if user is not signed in)
app.mount('#app');