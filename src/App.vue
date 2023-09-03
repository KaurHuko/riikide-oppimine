<script setup lang="ts">
</script>

<template>
  <header>
  </header>

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
