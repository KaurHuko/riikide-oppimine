import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import { setup } from "./countrydisplay"

createApp(App).mount('#app');

setup();