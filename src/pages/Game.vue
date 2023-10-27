<script setup lang="ts">

import { gameSetup } from "@/scripts/game/game-logic";
import { router } from "@/scripts/router/index";

router.isReady().then(() => {
  const urlParams = new URLSearchParams(window.location.search);
  gameSetup(urlParams.get("region"), urlParams.get("list"));
});

</script>

<template>
  <header></header>

  <main>

    <svg id="map" width="100%" height="100%">
      <g id="countries"></g>
    </svg>

    <div id="input-area">
      <div id="feedback"><br></div>
      <form id="country-guess-form">
        <input id="country-input" placeholder="Sisesta riigi nimi" autocomplete="off">
      </form>
    </div>

  </main>

</template>

<style scoped>
</style>
