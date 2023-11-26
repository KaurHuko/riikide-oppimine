<script setup lang="ts">

import { createApp } from 'vue';
import GameMode from '../components/GameMode.vue';
import { countryRegionMap } from "@/scripts/game/country-list"
import { router } from '@/scripts/router';

const gamemodes = document.getElementById("gamemodes")!;

for (const region of countryRegionMap) {
  const regionName = region[0];
  
  const div = document.createElement("div");
  div.id = `mode-${regionName}`;
  gamemodes.appendChild(div);

  const gamemode = createApp(GameMode, {
    region: regionName,
    list: "küberson"
  });

  gamemode.use(router);
  gamemode.mount("#" + div.id);
}

</script>

<template>

  <div id="gamemodes"></div>

</template>