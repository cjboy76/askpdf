<template>
  <NuxtLayout>
    <NuxtPage class="max-h-screen bg-black color-zinc-100" />
  </NuxtLayout>
  <UNotifications />
</template>

<script setup>
useHead({
  title: 'AskPDF',
  meta: [
    {
      name: 'description',
      content:
        'A AI PDF Reader App with integrated chat, read and discuss in real time.'
    },
  ]
})
useSeoMeta({
  title: 'AskPDF',
  ogTitle: 'AskPDF',
  description: 'A AI PDF Reader App with integrated chat, read and discuss in real time.',
  ogDescription: 'A AI PDF Reader App with integrated chat, read and discuss in real time.',
  ogImage: 'https://github.com/cjboy76/askpdf/blob/main/public/og.jpeg',
  twitterCard: 'summary_large_image',
})
</script>

<style>
html {
  background-color: black;
}

body {
  margin: 0;
}
</style>
