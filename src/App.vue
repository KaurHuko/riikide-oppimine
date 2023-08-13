<script setup lang="ts">
</script>

<template>
  <header>
  </header>

  <main>
    <svg id="map" width="1200" height="600">
      <animate attributeName="viewBox" values="0 0 600 400; 250 180 300 200" begin="-1h" dur="2000ms" fill="freeze"/>
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
