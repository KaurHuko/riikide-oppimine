<script setup lang="ts">
import { router } from '@/scripts/router';
import { getChosenCountryList } from '@/scripts/game/country-list';

const props = defineProps(["region", "displayName"]);

const region = props.region;
const displayName = props.displayName;

function onClick() {
  router.push(`game?region=${region}&list=${getChosenCountryList()}`);
}

</script>

<template>
  <button class="home-button region-option" @click="onClick()">
    <img :src="`/continent-icons/${region}.png`">
    <br>
    {{ displayName }}
  </button>
</template>