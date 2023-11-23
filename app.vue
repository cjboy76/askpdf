<template>
  <div>hello world</div>
</template>

<script setup lang="ts">
const { data } = await useFetch(
  "/api/pdfloader?url=https://www.africau.edu/images/default/sample.pdf"
);

console.log(data.value);
</script>
