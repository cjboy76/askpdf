<template>
  <div class="h-screen flex flex-col">
    <nav>
      <div class="flex justify-between">
        <div>chatPdf</div>
        <div class="flex">
          <UiButton>Theme</UiButton>
          <UiButton>歷史</UiButton>
          <UiButton>登入</UiButton>
        </div>
      </div>
    </nav>
    <slot />
  </div>
</template>
