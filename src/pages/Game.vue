<script setup lang="ts">

import { gameSetup } from "@/scripts/game/game-logic";
import { router } from "@/scripts/router/index";

router.isReady().then(() => {
  const urlParams = new URLSearchParams(window.location.search);
  gameSetup(urlParams.get("region"), urlParams.get("list"));
});

</script>

<template>

  <svg id="map" width="100%" height="100%">
    <g id="countries"></g>
    <circle id="country-highlighter" r="0.75"></circle>
  </svg>

  <div id="input-area">

    <div id="feedback">
      <span>&nbsp</span>
      <span id="feedback-text"></span>
      <span>&nbsp</span>
      <RouterLink id="feedback-home-link" hidden="true" to="/">Pealehele</RouterLink>
    </div>

    <form id="country-form">
      <input class="country-form" id="country-input" type="search" placeholder="Sisesta riigi nimi" autocomplete="off">
      <button class="country-form" id="country-submit-button">
        <img class="country-form" id="country-submit-image" src="../assets/icons/check.svg">
      </button>
    </form>

  </div>

</template>

<style scoped>
</style>
