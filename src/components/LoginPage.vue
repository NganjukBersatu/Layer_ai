<script setup>
import LoginForm from './LoginForm.vue'

const emit = defineEmits(["login", "forgot-password", "register"]);
</script>

<template>
  <div class="login-page">
    <div class="catalog-dots">
      <span
        v-for="n in 45"
        :key="n"
        class="catalog-dot"
        :style="{
          left: `${(n * 37) % 100}%`,
          top: `${(n * 53) % 100}%`,
          animationDelay: `${(n % 8) * 0.4}s`
        }"
      ></span>
    </div>

    <div class="login-card">
      <LoginForm
        @login="emit('login')"
        @forgot-password="emit('forgot-password')"
        @register="emit('register')"
      />
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  overflow: hidden;
  box-sizing: border-box;
  padding: 16px 16px 16px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  isolation: isolate;
}

.catalog-dots {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;
}

.catalog-dot {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.60);
  box-shadow: 0 0 5px rgba(99, 102, 241, 0.35), 0 0 10px rgba(99, 102, 241, 0.18);
  opacity: 0;
  animation: dotMove 9s linear infinite;
}

@keyframes dotMove {
  0% { transform: translate(-30px, 30px); opacity: 0; }
  15% { opacity: 0.75; }
  85% { opacity: 0.75; }
  100% { transform: translate(40px, -40px); opacity: 0; }
}

.login-card {
  position: relative;
  z-index: 10;

  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 35px;

  background: var(--bg-card);

  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

@media (max-width: 480px) {
  .login-card {
    padding: 28px 22px;
    border-radius: 16px;
  }

  
}

</style>