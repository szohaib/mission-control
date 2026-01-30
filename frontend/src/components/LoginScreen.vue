<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-mission-darker via-mission-dark to-blue-900/20">
    <div class="panel w-full max-w-md animate-glow">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-cyan-400 mb-2">⚡ MISSION CONTROL</h1>
        <p class="text-gray-400">Squad Leader Authorization Required</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-2">Access Code</label>
          <input
            v-model="password"
            type="password"
            placeholder="Enter authorization code"
            class="w-full bg-mission-darker border border-cyan-500/30 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
            :class="{ 'border-red-500': error }"
          />
        </div>
        
        <div v-if="error" class="text-red-400 text-sm">
          {{ error }}
        </div>
        
        <button type="submit" class="btn-primary w-full" :disabled="loading">
          <span v-if="loading">⏳ Authenticating...</span>
          <span v-else>🚀 INITIALIZE MISSION CONTROL</span>
        </button>
      </form>
      
      <div class="mt-6 text-center text-xs text-gray-500">
        <p>NASA meets Stark Industries™</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['login'])
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!password.value) {
    error.value = '❌ Please enter access code'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: password.value })
    })

    const data = await response.json()

    if (response.ok && data.token) {
      // Store JWT token in localStorage
      localStorage.setItem('mission_control_token', data.token)
      localStorage.setItem('mission_control_token_expires', Date.now() + (data.expiresIn * 1000))
      
      // Emit login event with token
      emit('login', data.token)
      error.value = ''
    } else {
      error.value = '❌ ' + (data.message || 'Invalid access code')
      password.value = ''
    }
  } catch (err) {
    console.error('Login error:', err)
    error.value = '❌ Connection failed. Please try again.'
    password.value = ''
  } finally {
    loading.value = false
  }
}
</script>
