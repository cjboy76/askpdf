<template>
  <div>hello world</div>
</template>

<script setup lang="ts">
const source = "https://www.scholastic.com/hpread/HP_Book1_Chapter_Excerpt.pdf";
const { data } = await useFetch(`/api/pdfloader?url=${source}`);

console.log(data.value);
</script>
