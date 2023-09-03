import { createApp } from 'vue'
import App from '../App.vue'
import '../styles/styles.css'
import { gameSetup } from "./game/game-logic"

createApp(App).mount('#app');

gameSetup();