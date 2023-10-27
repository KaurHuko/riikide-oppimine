import { createApp } from "vue";
import { router } from "./router";

import App from "@/App.vue"
import "@/styles/styles.css"
import { countryListSetup } from "./game/country-list";

countryListSetup();

const app = createApp(App);
app.use(router);

router.isReady()
    .then(() => {
        app.mount("#app");
    });
