import { createRouter, createWebHistory } from 'vue-router'
import { useLoginModal } from '../composables/useLoginModal.js'
import LoginPage from '../components/LoginPage.vue'
import ForgotPasswordPage from '../components/ForgotPasswordPage.vue'
import RegisterPage from '../components/RegisterPage.vue'
import CatalogPage from '../components/CatalogPage.vue'
import CatalogDetailPage from '../components/CatalogDetailPage.vue' // halaman DESKRIPSI (baru)
import CatalogEditPage from '../components/CatalogEditPage.vue'     // halaman EDIT (dulunya CatalogDetailPage)
import InputPage from '../components/InputPage.vue'
import ProcessPage from '../components/ProcessPage.vue'
import PreviewPage from '../components/PreviewPage.vue'
import HistoryPage from '../components/HistoryPage.vue'
import CatalogUploadPage from '../components/CatalogUploadPage.vue'

const routes = [
  { path: '/login', name: 'Login', component: LoginPage, meta: { public: true } },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPasswordPage, meta: { public: true } },
  { path: '/register', name: 'Register', component: RegisterPage, meta: { public: true } },
  { path: '/', name: 'Catalog', component: CatalogPage, meta: { public: true } },
  { path: '/catalog/new', name: 'CatalogNew', component: CatalogUploadPage, meta: { requiresAdmin: true } },
  { path: '/catalog/:id', name: 'CatalogDetail', component: CatalogDetailPage, meta: { public: true } },
  { path: '/catalog/:id/edit', name: 'CatalogEdit', component: CatalogEditPage, meta: { requiresAdmin: true } },
  { path: '/split-gambar', name: 'SplitGambar', component: InputPage },
  { path: '/process', name: 'Process', component: ProcessPage },
  { path: '/preview', name: 'Preview', component: PreviewPage },
  { path: '/history', name: 'History', component: HistoryPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
    scrollBehavior(to, from, savedPosition) {
    // Halaman publik (login/register/lupa password) tidak perlu delay,
    // supaya tidak sempat menampilkan sisa scroll halaman sebelumnya.
    if (to.meta.public) {
      return { top: 0 };
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        if (savedPosition) {
          resolve(savedPosition);
        } else {
          resolve({ top: 0 });
        }
      }, 300);
    });
  },
})

// Guard: halaman selain login/forgot-password/register wajib login dulu
router.beforeEach((to) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const isAdmin = localStorage.getItem('isAdmin') === 'true'

  if (!to.meta.public && !isLoggedIn) {
    const { openLoginModal } = useLoginModal()
    openLoginModal(to.fullPath)
    return false // batalkan pindah halaman, tetap di posisi semula, modal muncul di atasnya
  }
  
  if (to.meta.requiresAdmin && !isAdmin) {
    return { name: 'Catalog' }
  }
  if (to.name === 'Login' && isLoggedIn) {
    return { name: 'Catalog' }
  }
})

export default router