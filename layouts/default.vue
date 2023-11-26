<template>
  <div class="h-screen flex flex-col">
    <div class="container mx-auto">
      <nav class="py-4 px-4">
        <div class="flex justify-between items-center">
          <div>ChatPDF</div>
          <div class="flex">
            <AppButton>外觀</AppButton>
            <AppButton>歷史</AppButton>
            <AppButton>登入</AppButton>
          </div>
        </div>
      </nav>
      <slot />
    </div>
  </div>
</template>
