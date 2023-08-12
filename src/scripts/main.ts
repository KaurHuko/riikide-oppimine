import { createApp } from 'vue'
import App from '../App.vue'
import '../styles/main.css'
import { setup } from "./countrydisplay"

createApp(App).mount('#app');

setup();