<template>
  <NuxtLayout>
    <NuxtPage class="h-screen bg-zinc-800 color-zinc-100" />
  </NuxtLayout>
</template>

<script setup>
useHead({
  title: 'AI PDF 閱讀小工具',
  meta: [
    {
      name: 'description',
      content:
        'A AI PDF Reader App with integrated chat, read and discuss in real time.'
    },
    {
      name: 'description',
      content:
        'AI PDF 閱讀小工具，提供實時對話、閱讀與討論'
    }
  ]
})
</script>

<style>
html {
  background-color: rgb(39 39 42);
}

body {
  margin: 0;
}
</style>
