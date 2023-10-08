import { createRouter, createWebHistory } from "vue-router";

import Home from "@/pages/Home.vue";
import Game from "@/pages/Game.vue";

const routes = [
    {
        path: "/",
        component: Home
    },
    {
        path: "/game",
        component: Game
    }
];

export const router = createRouter({
    history: createWebHistory(),
    routes: routes
});
