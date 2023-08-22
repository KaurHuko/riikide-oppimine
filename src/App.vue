<script setup lang="ts">
</script>

<template>
  <header>
  </header>

  <main>
    <svg id="map" width="1200" height="600">
      <g id="countries"></g>
    </svg>

    <br><br>
    <div id="feedback"><br></div>
    <form id="country-guess-form">
      Guess The Country:
      <input id="country-name">
      <button type="submit">Guess</button>
    </form>

  </main>
</template>

<style scoped>

</style>
