<script setup lang="ts">
const props = defineProps(["region", "list"]);

const region = props.region;

function geturl() {
    return `/game?region=${region}&list=${props.list}`
}

</script>

<template>
  <router-link :to="geturl()">{{ region }}</router-link>
</template>