import { createI18n } from 'vue-i18n'

const messages = {}
const localeFiles = import.meta.glob('./locales/*.json', { eager: true })

for (const path in localeFiles) {
  const locale = path.match(/([a-zA-Z-]+)\.json$/)[1]
  messages[locale] = localeFiles[path].default
}

const i18n = createI18n({
  legacy: false,
  locale: 'id',
  fallbackLocale: 'en',
  messages
})

export default i18n