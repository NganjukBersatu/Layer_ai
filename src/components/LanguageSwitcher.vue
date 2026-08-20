<script setup>
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

const { locale } = useI18n()
const isOpen = ref(false)

function changeLang(lang) {
  locale.value = lang
  isOpen.value = false
}
</script>

<template>
  <div class="lang-switcher">
    <!-- Tombol utama -->
    <button
      class="lang-button"
      @click="isOpen = !isOpen"
      type="button"
    >
    <span class="lang-icon">
    {{ locale === 'id' ? '🇮🇩' : locale === 'en' ? '🇪🇳' : locale === 'ja' ? '🇯🇵' : '🇰🇷' }}
</span>

      <span class="lang-text">
  {{ locale === 'id' ? 'Indonesia' : locale === 'en' ? 'English' : locale === 'ja' ? '日本語' : '한국어' }}
</span>

      <span class="lang-arrow" :class="{ open: isOpen }">
        ▾
      </span>
    </button>

    <!-- Dropdown -->
    <div v-if="isOpen" class="lang-menu">

      <button
        type="button"
        class="lang-option"
        :class="{ active: locale === 'id' }"
        @click="changeLang('id')"
      >
        <span class="lang-icon">🇮🇩</span>
        <span>Indonesia</span>
        <span v-if="locale === 'id'" class="check">✓</span>
      </button>

      <button
        type="button"
        class="lang-option"
        :class="{ active: locale === 'en' }"
        @click="changeLang('en')"
      >
        <span class="lang-icon">🇪🇳</span>
        <span>English</span>
        <span v-if="locale === 'en'" class="check">✓</span>
      </button>

      <button
        type="button"
        class="lang-option"
        :class="{ active: locale === 'ja' }"
        @click="changeLang('ja')"
      >
        <span class="lang-icon">🇯🇵</span>
        <span>日本語</span>
        <span v-if="locale === 'ja'" class="check">✓</span>
      </button>

      <button
        type="button"
        class="lang-option"
        :class="{ active: locale === 'ko' }"
        @click="changeLang('ko')"
      >
        <span class="lang-icon">🇰🇷</span>
        <span>한국어</span>
        <span v-if="locale === 'ko'" class="check">✓</span>
      </button>

</div>
</div>
</template>

<style scoped>
.lang-switcher {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
}

/* =========================
   MAIN BUTTON
========================= */

.lang-button {
  display: flex;
  align-items: center;
  gap: 9px;

  min-width: 145px;
  padding: 9px 13px;

  border: 1px solid var(--border-color);
  border-radius: 12px;

  background: var(--bg-card);
  color: var(--text-primary);

  font-family: inherit;
  font-size: 14px;
  font-weight: 500;

  cursor: pointer;

  box-shadow: 0 3px 12px rgba(30, 35, 60, 0.08);

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.lang-button:hover {
  border-color: #8b7cf6;
  box-shadow: 0 5px 16px rgba(80, 70, 160, 0.13);
  transform: translateY(-1px);
}

.lang-icon {
  width: 25px;
  flex-shrink: 0;

  font-size: 13px;
  line-height: 1;
  font-weight: 500;

  text-align: center;
}

.lang-text {
  flex: 1;
  text-align: left;
  white-space: nowrap;
}

.lang-arrow {
  font-size: 15px;
  color: #777b8c;

  transition: transform 0.2s ease;
}

.lang-arrow.open {
  transform: rotate(180deg);
}

/* =========================
   DROPDOWN
========================= */

.lang-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;

  width: 175px;
  padding: 6px;
  max-height: 260px;
  overflow-y: auto;

  background: var(--bg-card);
  border: 1px solid var(--border-color);

  border-radius: 13px;

  box-shadow: 0 10px 30px var(--shadow-color);

  z-index: 1000;

  animation: dropdownIn 0.18s ease;
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =========================
   OPTIONS
========================= */

.lang-option {
  width: 100%;

  display: flex;
  align-items: center;
  gap: 10px;

  padding: 10px 11px;

  border: none;
  border-radius: 9px;

  background: transparent;
  color: var(--text-primary);

  font-family: inherit;
  font-size: 14px;

  cursor: pointer;

  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.lang-option:hover {
  background: color-mix(in srgb, var(--accent-color) 12%, transparent);
  color: var(--accent-color);
}

.lang-option.active {
  background: color-mix(in srgb, var(--accent-color) 18%, transparent);
  color: var(--accent-color);
  font-weight: 500;
}

.lang-option .check {
  margin-left: auto;
  font-size: 16px;
  font-weight: 700;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 600px) {
  .lang-button {
    min-width: auto;
    width: 32px;
    height: 32px;
    padding: 0;
    justify-content: center;
    gap: 0;
    border-radius: 9px;
  }

  .lang-text {
    display: none;
  }

  .lang-arrow {
    display: none;
  }

  .lang-icon {
    width: auto;
    font-size: 15px;
  }

  .lang-menu {
    right: 0;
    width: 160px;
  }
}

@media (max-width: 360px) {
  .lang-button {
    width: 28px;
    height: 28px;
  }
}
</style>