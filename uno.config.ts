// uno.config.ts
import {
    defineConfig,
    presetAttributify,
    presetIcons,
    presetTypography,
    presetUno,
    transformerDirectives,
    transformerVariantGroup,
  } from 'unocss'
  
  export default defineConfig({
    presets: [
      presetUno(),
      presetAttributify(),
      presetIcons(),
      presetTypography(),
    ],
    transformers: [
      transformerDirectives(),
      transformerVariantGroup(),
    ],
    preflights: [
      {
        layer: 'primevue-layer',
        getCSS: async () => (await fetch('/assets/theme.css')).text(),
      },
    ],
    layers: {
      'components': -1,
      'default': 1,
      'utilities': 2,
      'primevue-layer': 3,
    }
  })