<script setup lang="ts">

import { createApp, onMounted, ref, type MethodOptions, type App } from 'vue';
import { countryRegionMap, countryListMap, chooseCountryList, chosenCountryList, countryListNameMap } from "@/scripts/game/country-list"
import { router } from '@/scripts/router';

import Dropdown from 'v-dropdown';
import GameMode from '@/components/GameMode.vue';
import ListOption from '@/components/ListOption.vue';

const gamemodes = ref<HTMLDivElement | null>(null);
const listoptions = ref<HTMLDivElement | null>(null);
const dropdowntext = ref<HTMLDivElement | null>(null);
const listdropdown = ref<MethodOptions | null>(null);
const arrowicon = ref<HTMLImageElement | null>(null);

onMounted(() => {

  for (const region of countryRegionMap.values()) {
    const gamemode = createApp(GameMode, {
      region: region.name,
      displayName: region.displayName,
      list: "küberson",
    });
    addApp(`mode-${region.name}`, gamemodes.value!, gamemode);
  }

  for (const list of countryListMap.keys()) {
    const listOption = createApp(ListOption, {list, clickevent: onListPick});
    addApp(`list-option-${list}`, listoptions.value!, listOption);
  }

  onListPick(chosenCountryList);

  onVisibleChange(false);
});

function addApp(id: string, parent: HTMLElement, app: App<Element>) {
    const div = document.createElement("div");
    div.id = id;
    parent.appendChild(div);

    app.use(router);
    app.mount("#" + div.id);
}

function onListPick(list: string) {
  chooseCountryList(list);
  dropdowntext.value!.innerHTML = countryListNameMap.get(chosenCountryList)! + "";
  listdropdown.value?.close();
}

function onVisibleChange(visible: boolean) {
  if (visible) arrowicon.value!.style.transform = "rotate(0deg)";
  else arrowicon.value!.style.transform = "rotate(-90deg)";
}

</script>

<template>
  <div id="home-window">

    <Dropdown class="home-button list-dropdown" ref="listdropdown" :border="false" v-on:visible-change="onVisibleChange">
      <template #trigger>
        <button class="home-button list-option">
          <img class="dropdown-arrow" src="../assets/icons/point-down.svg" ref="arrowicon">
          <div ref="dropdowntext"></div>
        </button>
      </template>

      <div ref="listoptions"></div>
    </Dropdown>
    
    <div ref="gamemodes"></div>

  </div>
</template>