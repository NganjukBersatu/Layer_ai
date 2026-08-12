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
    <button @click="isOpen = !isOpen">🌐 Bahasa</button>
    <ul v-if="isOpen" class="lang-dropdown">
      <li @click="changeLang('id')">Indonesia</li>
      <li @click="changeLang('en')">English</li>
    </ul>
  </div>
</template>

<style scoped>
.lang-switcher {
  position: fixed;
  top: 16px;
  right: 16px;
}
.lang-dropdown {
  list-style: none;
  padding: 8px;
  margin: 4px 0 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.lang-dropdown li {
  padding: 8px 12px;
  cursor: pointer;
}
.lang-dropdown li:hover {
  background: #f0f0f0;
}
</style>