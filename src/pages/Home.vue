<script setup lang="ts">

import { createApp, onMounted, ref, type MethodOptions } from 'vue';
import { countryRegionMap, countryListMap, chooseCountryList, chosenCountryList, countryListNameMap } from "@/scripts/game/country-list"
import { router } from '@/scripts/router';

import Dropdown from 'v-dropdown';
import GameMode from '@/components/GameMode.vue';
import ListOption from '@/components/ListOption.vue';

const gamemodes = ref<HTMLDivElement | null>(null);
const listoptions = ref<HTMLDivElement | null>(null);
const listoptionbutton = ref<HTMLDivElement | null>(null);
const listdropdown = ref<MethodOptions | null>(null);

onMounted(() => {

  for (const region of countryRegionMap.values()) {
    const div = document.createElement("div");
    div.id = `mode-${region.name}`;
    gamemodes.value?.appendChild(div);

    const gamemode = createApp(GameMode, {
      region: region.name,
      displayName: region.displayName,
      list: "küberson",
    });
    
    gamemode.use(router);
    gamemode.mount("#" + div.id);
  }

  for (const list of countryListMap.keys()) {
    const div = document.createElement("div");
    div.id = `list-option-${list}`
    listoptions.value?.appendChild(div);

    const listOption = createApp(ListOption, {list, clickevent: onListPick});

    listOption.use(router);
    listOption.mount("#" + div.id);
  }

  onListPick(chosenCountryList);

});

function onListPick(list: string) {
  chooseCountryList(list);
  listoptionbutton.value!.innerHTML = countryListNameMap.get(chosenCountryList)!;
  listdropdown.value?.close();
}

</script>

<template>

  <Dropdown ref="listdropdown">
    <template #trigger>
      <button ref="listoptionbutton"></button>
    </template>

    <div ref="listoptions"></div>
  </Dropdown>
  
  <div ref="gamemodes"></div>

</template>