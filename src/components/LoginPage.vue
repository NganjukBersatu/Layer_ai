<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Login</h2>

      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />

      <button>Sign In</button>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
}

.login-card {
  width: 360px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,.1);
}

.login-card h2 {
  text-align: center;
  margin-bottom: 20px;
}

.login-card input {
  width: 100%;
  height: 45px;
  margin-bottom: 15px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-sizing: border-box;
}

.login-card button {
  width: 100%;
  height: 45px;
  border: none;
  border-radius: 8px;
  background: #5b3df5;
  color: white;
  cursor: pointer;
}
</style>