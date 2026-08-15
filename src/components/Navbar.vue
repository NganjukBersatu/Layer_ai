<script setup>
import { ref, onMounted } from 'vue'
import LanguageSwitcher from './LanguageSwitcher.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const theme = ref(localStorage.getItem('theme') || 'system')
const isThemeMenuOpen = ref(false)

function applyTheme(value) {
  const root = document.documentElement
  if (value === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', value)
  }
}

function setTheme(value) {
  theme.value = value
  localStorage.setItem('theme', value)
  applyTheme(value)
  isThemeMenuOpen.value = false
}

onMounted(() => {
  applyTheme(theme.value)
})
</script>

<template>
  <nav class="navbar">
    <div class="navbar-title">{{ t('app.title') }}</div>

    <div class="navbar-actions">
      <div class="theme-switcher">
        <button class="theme-button" type="button" @click="isThemeMenuOpen = !isThemeMenuOpen">
          <svg v-if="theme === 'light'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
          <svg v-else-if="theme === 'dark'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
        </button>

        <div v-if="isThemeMenuOpen" class="theme-menu">
          <button type="button" class="theme-option" :class="{ active: theme === 'light' }" @click="setTheme('light')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            Terang
          </button>
          <button type="button" class="theme-option" :class="{ active: theme === 'dark' }" @click="setTheme('dark')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            Gelap
          </button>
          <button type="button" class="theme-option" :class="{ active: theme === 'system' }" @click="setTheme('system')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            Sistem
          </button>
        </div>
      </div>

      <LanguageSwitcher />
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 40px;

  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 2px 10px var(--shadow-color);

  position: sticky;
  top: 0;
  z-index: 900;
}

.navbar-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent-color);
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-switcher {
  position: relative;
}

.theme-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  box-shadow: 0 3px 12px var(--shadow-color);
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.theme-button:hover {
  border-color: #8b7cf6;
  transform: translateY(-1px);
}

.theme-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 150px;
  padding: 6px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 13px;
  box-shadow: 0 10px 30px var(--shadow-color);
  z-index: 1000;
}

.theme-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.theme-option:hover {
  background: color-mix(in srgb, var(--accent-color) 12%, transparent);
  color: var(--accent-color);
}

.theme-option.active {
  background: color-mix(in srgb, var(--accent-color) 18%, transparent);
  color: var(--accent-color);
  font-weight: 500;
}

@media (max-width: 600px) {
  .navbar {
    padding: 12px 16px;
  }

  .navbar-title {
    font-size: 16px;
  }
}
</style>