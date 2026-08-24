import { createRouter, createWebHistory } from 'vue-router'
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
  { path: '/', name: 'Catalog', component: CatalogPage },
  { path: '/catalog/new', name: 'CatalogNew', component: CatalogUploadPage },
  { path: '/catalog/:id', name: 'CatalogDetail', component: CatalogDetailPage },
  { path: '/catalog/:id/edit', name: 'CatalogEdit', component: CatalogEditPage },
  { path: '/split-gambar', name: 'SplitGambar', component: InputPage },
  { path: '/process', name: 'Process', component: ProcessPage },
  { path: '/preview', name: 'Preview', component: PreviewPage },
  { path: '/history', name: 'History', component: HistoryPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Ditunda supaya reset/restore scroll baru terjadi SETELAH
    // transisi page-fade (leave 0.2s) di App.vue selesai.
    // Kalau langsung (synchronous), halaman lama sempat "dipaksa"
    // scroll ke atas padahal masih terlihat saat fade-out,
    // sehingga muncul flash bagian atas halaman sebelumnya.
    return new Promise((resolve) => {
      setTimeout(() => {
        if (savedPosition) {
          resolve(savedPosition);
        } else {
          resolve({ top: 0 });
        }
      }, 300); // sedikit lebih lama dari durasi transisi (0.2s / 200ms)
    });
  },
})

// Guard: halaman selain login/forgot-password/register wajib login dulu
router.beforeEach((to) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'

  if (!to.meta.public && !isLoggedIn) {
    return { name: 'Login' }
  }
  if (to.name === 'Login' && isLoggedIn) {
    return { name: 'Catalog' }
  }
})

export default router