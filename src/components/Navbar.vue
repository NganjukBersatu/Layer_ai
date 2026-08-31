<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useClickOutside } from '../composables/useClickOutside.js'
import { useAuthUser } from '../composables/useAuthUser.js'
import LanguageSwitcher from './LanguageSwitcher.vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const route = useRoute()

const emit = defineEmits([
  'catalog',
  'split',
  'logout',
])

const theme = ref(localStorage.getItem('theme') || 'light')
const isThemeMenuOpen = ref(false)

const isMobileMenuOpen = ref(false)

const themeSwitcherRef = ref(null)
const hamburgerBtnRef = ref(null)
const mobileMenuRef = ref(null)


const { userPhoto, userName, userEmail, isAdmin, clearAuthUser } = useAuthUser()
const hasAvatar = computed(() => !isAdmin.value && !!userPhoto.value && !avatarLoadFailed.value)
watch(userPhoto, () => {
  avatarLoadFailed.value = false
})

const avatarLoadFailed = ref(false)

function handleAvatarError() {
  avatarLoadFailed.value = true
}

const isAvatarMenuOpen = ref(false)
const avatarSwitcherRef = ref(null)

// Katalog dianggap aktif untuk "/" dan semua sub-halamannya (/catalog/..)
const isCatalogActive = computed(() =>
  route.path === '/' || route.path.startsWith('/catalog')
)

// Split Gambar dianggap aktif untuk alur split (input, process, preview)
const isSplitActive = computed(() =>
  ['/split-gambar', '/process', '/preview', '/history'].includes(route.path)
)

useClickOutside(themeSwitcherRef, () => {
  isThemeMenuOpen.value = false
})

useClickOutside([hamburgerBtnRef, mobileMenuRef], () => {
  isMobileMenuOpen.value = false
})

useClickOutside(avatarSwitcherRef, () => {
  isAvatarMenuOpen.value = false
})

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

function handleLogout() {
  clearAuthUser()
  emit('logout')
}

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

// Sama seperti changeLang() di LanguageSwitcher.vue,
// dipakai khusus untuk tombol bahasa flat di mobile menu.
function changeLang(lang) {
  locale.value = lang
}

onMounted(() => {
  applyTheme(theme.value)
})
</script>

<template>
  <nav class="navbar">
    <!-- Kiri: hanya judul -->
    <div class="navbar-left">
      <div class="navbar-title">{{ t('app.title') }}</div>
    </div>

    <div class="navbar-actions">
      <!-- Katalog & Split selalu tampil (desktop + mobile) -->
      <div class="nav-links">
        <button
          type="button"
          class="nav-link"
          :class="{ active: isCatalogActive }"
          @click="emit('catalog')"
        >
          {{ t('nav.catalog') }}
        </button>

        <button
          type="button"
          class="nav-link"
          :class="{ active: isSplitActive }"
          @click="emit('split')"
        >
          {{ t('nav.split') }}
        </button>

      </div>

      <!-- Theme switcher (hanya desktop) -->
      <div class="theme-switcher desktop-only" ref="themeSwitcherRef">
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
            {{ t('theme.light') }}
          </button>
          <button type="button" class="theme-option" :class="{ active: theme === 'dark' }" @click="setTheme('dark')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            {{ t('theme.dark') }}
          </button>
          <button type="button" class="theme-option" :class="{ active: theme === 'system' }" @click="setTheme('system')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            {{ t('theme.system') }}
          </button>
        </div>
      </div>

      <!-- LanguageSwitcher (hanya desktop) -->
      <div class="desktop-only">
        <LanguageSwitcher />
      </div>

      <!-- Avatar Google (desktop) -->
      <div v-if="hasAvatar" class="avatar-switcher desktop-only" ref="avatarSwitcherRef">
        <button class="avatar-button" type="button" @click="isAvatarMenuOpen = !isAvatarMenuOpen">
          <img :src="userPhoto" alt="Foto profil" class="avatar-img" referrerpolicy="no-referrer" @error="handleAvatarError" />
        </button>
        <div v-if="isAvatarMenuOpen" class="avatar-menu">
          <div class="avatar-menu-header">
            <img :src="userPhoto" alt="Foto profil" class="avatar-menu-photo" referrerpolicy="no-referrer" @error="handleAvatarError" />
            <div class="avatar-menu-info">
              <span class="avatar-menu-name">{{ userName }}</span>
              <span class="avatar-menu-email">{{ userEmail }}</span>
            </div>
          </div>

          <div class="avatar-menu-divider"></div>

          <button type="button" class="avatar-menu-item" @click="handleLogout(); isAvatarMenuOpen = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {{ t('input.logout') }}
          </button>
        </div>
      </div>

      <!-- Fallback: tombol Keluar biasa (admin / login manual, tidak ada foto) -->
      <button v-else type="button" class="nav-link logout-link desktop-only" @click="handleLogout">
        {{ t('input.logout') }}
      </button>

      <!-- ===== TOMBOL HAMBURGER di ujung kanan ===== -->
      <button
        class="hamburger-btn"
        type="button"
        ref="hamburgerBtnRef"
        @click="toggleMobileMenu"
        :aria-expanded="isMobileMenuOpen"
      >
        <!-- Foto profil menggantikan ikon hamburger (kalau ada) -->
        <img v-if="hasAvatar && !isMobileMenuOpen" :src="userPhoto" alt="Foto profil" class="hamburger-avatar" referrerpolicy="no-referrer" @error="handleAvatarError" />
        <!-- Icon hamburger -->
        <svg v-else-if="!isMobileMenuOpen" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
        <!-- Icon close (X) -->
        <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Mobile menu: hanya Tema + Bahasa + Logout -->
    <div v-if="isMobileMenuOpen" class="mobile-menu" ref="mobileMenuRef">
      <!-- Menu utama -->
      <button
        type="button"
        class="mobile-menu-item"
        :class="{ active: isCatalogActive }"
        @click="emit('catalog'); closeMobileMenu()"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        {{ t('nav.catalog') }}
      </button>

      <button
        type="button"
        class="mobile-menu-item"
        :class="{ active: isSplitActive }"
        @click="emit('split'); closeMobileMenu()"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2 2 7l10 5 10-5-10-5Z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        {{ t('nav.split') }}
      </button>

      <div class="mobile-menu-divider"></div>

      <!-- Tema -->
      <div class="mobile-menu-label">{{ t('theme.sectionTitle') }}</div>

      <button
        type="button"
        class="mobile-menu-item"
        :class="{ active: theme === 'light' }"
        @click="setTheme('light'); closeMobileMenu()"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
        {{ t('theme.light') }}
      </button>

      <button
        type="button"
        class="mobile-menu-item"
        :class="{ active: theme === 'dark' }"
        @click="setTheme('dark'); closeMobileMenu()"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        {{ t('theme.dark') }}
      </button>

      <button
        type="button"
        class="mobile-menu-item"
        :class="{ active: theme === 'system' }"
        @click="setTheme('system'); closeMobileMenu()"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path d="M8 21h8M12 17v4"/>
        </svg>
        {{ t('theme.system') }}
      </button>

      <div class="mobile-menu-divider"></div>

      <!-- Bahasa: flat, tanpa dropdown -->
      <div class="mobile-menu-label">{{ t('language.sectionTitle') }}</div>

      <button
        type="button"
        class="mobile-menu-item"
        :class="{ active: locale === 'id' }"
        @click="changeLang('id'); closeMobileMenu()"
      >
        <span class="mobile-menu-flag">🇮🇩</span>
        Indonesia
      </button>

      <button
        type="button"
        class="mobile-menu-item"
        :class="{ active: locale === 'en' }"
        @click="changeLang('en'); closeMobileMenu()"
      >
        <span class="mobile-menu-flag">🇬🇧</span>
        English
      </button>

      <button
        type="button"
        class="mobile-menu-item"
        :class="{ active: locale === 'ja' }"
        @click="changeLang('ja'); closeMobileMenu()"
      >
        <span class="mobile-menu-flag">🇯🇵</span>
        日本語
      </button>

      <button
        type="button"
        class="mobile-menu-item"
        :class="{ active: locale === 'ko' }"
        @click="changeLang('ko'); closeMobileMenu()"
      >
        <span class="mobile-menu-flag">🇰🇷</span>
        한국어
      </button>

      <div class="mobile-menu-divider"></div>

      <!-- Logout -->
      <button
        type="button"
        class="mobile-menu-item logout"
        @click="handleLogout(); closeMobileMenu()"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        {{ t('input.logout') }}
      </button>
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

  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 900;
}

.navbar-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--accent-color);
  letter-spacing: -0.3px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-link {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  padding: 9px 12px;
  border-radius: 9px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
  white-space: nowrap;
}

.nav-link:hover {
  color: var(--accent-color);
  background: var(--bg-accent-soft);
}

.nav-link.active {
  color: var(--accent-color);
  background: var(--bg-accent-soft);
}

.logout-link {
  color: #f87171;
}

.logout-link:hover {
  color: #fff;
  background: #dc2626;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.theme-switcher {
  position: relative;
  flex-shrink: 0;
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
  flex-shrink: 0;
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

.avatar-switcher {
  position: relative;
  flex-shrink: 0;
}

.avatar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
}

.avatar-img,
.hamburger-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-color);
  display: block;
}

.avatar-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 230px;
  padding: 6px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 13px;
  box-shadow: 0 10px 30px var(--shadow-color);
  z-index: 1000;
}

.avatar-menu-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
}

.avatar-menu-photo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}

.avatar-menu-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.avatar-menu-name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avatar-menu-email {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avatar-menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 4px 6px;
}

.avatar-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  padding: 9px 11px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #f87171;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.avatar-menu-item:hover {
  background: #dc2626;
  color: #fff;
}

/* ===== Hamburger & Mobile Menu ===== */
.navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hamburger-btn {
  display: none; /* disembunyikan di desktop */
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  flex-shrink: 0;
}

.mobile-menu {
  display: none; /* default hidden */
  position: absolute;
  top: calc(100% + 8px);
  right: 12px;
  left: auto;
  width: 200px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 13px;
  box-shadow: 0 10px 30px var(--shadow-color);
  padding: 6px;
  z-index: 950;
  flex-direction: column;
  gap: 2px;
}

.mobile-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  padding: 9px 11px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.mobile-menu-item svg {
  flex-shrink: 0;
}

.mobile-menu-item:hover {
  background: color-mix(in srgb, var(--accent-color) 12%, transparent);
  color: var(--accent-color);
}

.mobile-menu-item.active {
  background: color-mix(in srgb, var(--accent-color) 18%, transparent);
  color: var(--accent-color);
  font-weight: 500;
}

.mobile-menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 6px 4px;
}

.mobile-menu-label {
  padding: 4px 11px 2px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
  opacity: 0.7;
}

/* Indikator chevron di wrapper bahasa, supaya terlihat "bisa dibuka"
   tanpa perlu mengubah markup internal LanguageSwitcher.vue */
.mobile-menu-flag {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.mobile-menu-item.logout {
  color: #f87171;
}

.mobile-menu-item.logout:hover {
  background: #dc2626;
  color: white;
}

/* =========================================
   MOBILE: navbar dibuat 2 baris supaya tidak
   ada elemen yang terdorong keluar/terpotong
   (termasuk LanguageSwitcher).
========================================= */
@media (max-width: 600px) {
  .navbar {
    flex-wrap: wrap;
    row-gap: 8px;
    padding: 10px 12px;
  }

  .navbar-title {
    font-size: 17px;
    flex: 1 1 auto;
    min-width: 0;
  }

  .navbar-actions {
    width: 100%;
    justify-content: space-between;
    gap: 6px;
    flex-wrap: nowrap;
  }

  .nav-links {
    display: none; /* Katalog & Split Gambar sudah ada di dalam hamburger */
  }

  .theme-button {
    width: 32px;
    height: 32px;
    border-radius: 9px;
  }

  .theme-button svg {
    width: 15px;
    height: 15px;
  }

  .hamburger-btn {
    display: flex; /* tampilkan hamburger */
  }

  .desktop-only {
    display: none !important; /* sembunyikan theme & language di desktop mode */
  }

  .mobile-menu {
    display: flex; /* tampilkan dropdown saat dibuka */
  }

  .navbar {
    flex-wrap: nowrap; /* biar title + hamburger sejajar */
    padding: 10px 12px;
  }

  .navbar-title {
    font-size: 20px;
    white-space: nowrap;
  }

  .navbar-actions {
    width: auto;
    gap: 8px;
  }
}

@media (max-width: 360px) {
  .navbar-title {
    font-size: 18px;
  }
}
</style>