import type { Options } from 'markdown-it'
import markdownit from 'markdown-it'
import hljs from 'highlight.js'

export type MarkdownType = {
  source: string
  options?: Options
}

export default defineComponent((props: MarkdownType) => {
  const md = shallowRef(new markdownit(props.options ?? {
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) return hljs.highlight(str, { language: lang }).value
      return '' // use external default escaping
    },
  }))
  const content = computed(() => md.value.render(props.source))
  return () => h('div', { innerHTML: content.value })
}, {
  props: ['source', 'options'],
})
