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
        {{ locale === 'id' ? '🇮🇩' : locale === 'ja' ? '🇯🇵' : locale === 'ko' ? '🇰🇷' : '🇪🇳' }}
    </span>

      <span class="lang-text">
        {{ locale === 'id' ? 'Indonesia' : locale === 'ja' ? '日本語' : locale === 'ko' ? '한국어' : 'English' }}
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

  border: 1px solid #e2e5f0;
  border-radius: 12px;

  background: #ffffff;
  color: #25283a;

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

  background: #ffffff;

  border: 1px solid #e8e9f1;
  border-radius: 13px;

  box-shadow: 0 10px 30px rgba(30, 35, 60, 0.12);

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
  color: #333647;

  font-family: inherit;
  font-size: 14px;

  cursor: pointer;

  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.lang-option:hover {
  background: #f4f3ff;
  color: #6657d9;
}

.lang-option.active {
  background: #f0efff;
  color: #6657d9;
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
    padding: 8px 10px;
  }

  .lang-text {
    display: none;
  }

  .lang-menu {
    right: 0;
  }
}
</style>