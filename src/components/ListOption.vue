<script setup lang="ts">
import { countryListNameMap } from '@/scripts/game/country-list';

const props = defineProps(["list", "clickevent"]);

const list = props.list;
const displayName = countryListNameMap.get(list);
const clickevent = props.clickevent;

</script>

<template>
  <button @click="clickevent(list)">{{ displayName }}</button>
</template>