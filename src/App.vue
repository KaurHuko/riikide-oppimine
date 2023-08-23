<script setup lang="ts">
</script>

<template>
  <header>
  </header>

  <main>

    <svg id="map" width="100%" height="100%">
      <g id="countries"></g>
    </svg>

    <div class="interactions">
      <div id="feedback"><br></div>
      <form id="country-guess-form">
        Guess The Country:
        <input id="country-name">
        <button type="submit">Guess</button>
      </form>
    </div>

  </main>
</template>

<style scoped>

</style>
