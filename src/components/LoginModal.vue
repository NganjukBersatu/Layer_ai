<script setup>
import { useRouter } from "vue-router";
import LoginForm from './LoginForm.vue'
import { useLoginModal } from '../composables/useLoginModal.js'

const { isOpen, redirectPath, closeLoginModal } = useLoginModal()
const router = useRouter()

const emit = defineEmits(['login'])

function handleLoginSuccess() {
  const target = redirectPath.value
  closeLoginModal()
  emit('login', target) // <-- kabari App.vue supaya isLoggedIn ikut ter-update
}
function goForgotPassword() {
  closeLoginModal();
  router.push('/forgot-password');
}

function goRegister() {
  closeLoginModal();
  router.push('/register');
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="login-modal-overlay" @click.self="closeLoginModal">
      <div class="login-modal-card">
        <button type="button" class="modal-close-btn" @click="closeLoginModal" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <LoginForm
          @login="handleLoginSuccess"
          @forgot-password="goForgotPassword"
          @register="goRegister"
        />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.login-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 21, 31, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
}

.login-modal-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  padding: 35px;
  background: var(--bg-card);
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  z-index: 1;
}

.modal-close-btn:hover {
  color: var(--accent-color);
}
</style>