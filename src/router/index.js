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

const routes = [
  { path: '/login', name: 'Login', component: LoginPage, meta: { public: true } },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPasswordPage, meta: { public: true } },
  { path: '/register', name: 'Register', component: RegisterPage, meta: { public: true } },
  { path: '/', name: 'Catalog', component: CatalogPage },
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