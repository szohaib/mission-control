<template>
  <div class="panel">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xl font-bold text-cyan-400">🤖 Agent Status Board</h3>
      <button @click="showSpawnForm = !showSpawnForm" class="btn-primary text-sm">
        ➕ Spawn Agent
      </button>
    </div>
    
    <!-- Spawn Agent Form -->
    <div v-if="showSpawnForm" class="mb-4 p-4 bg-mission-darker rounded border border-cyan-500/30">
      <h4 class="text-sm font-bold text-cyan-400 mb-2">Spawn New Agent</h4>
      <form @submit.prevent="handleSpawnAgent" class="space-y-2">
        <input
          v-model="newAgentTask"
          type="text"
          placeholder="Task description..."
          class="w-full bg-mission-dark border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
        />
        <div class="flex space-x-2">
          <button type="submit" class="btn-primary text-sm">Launch</button>
          <button type="button" @click="showSpawnForm = false" class="btn-secondary text-sm">Cancel</button>
        </div>
      </form>
    </div>
    
    <!-- Agent Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="agent in agents"
        :key="agent.id"
        class="bg-mission-darker rounded-lg p-4 border"
        :class="{
          'border-green-500/50': agent.status === 'working',
          'border-yellow-500/50': agent.status === 'standby',
          'border-red-500/50': agent.status === 'blocked'
        }"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center space-x-2">
            <span class="status-indicator" :class="`status-${agent.status}`"></span>
            <h4 class="font-bold text-white">{{ agent.name }}</h4>
          </div>
          <span class="text-xs px-2 py-1 rounded" :class="{
            'bg-green-500/20 text-green-400': agent.status === 'working',
            'bg-yellow-500/20 text-yellow-400': agent.status === 'standby',
            'bg-red-500/20 text-red-400': agent.status === 'blocked'
          }">
            {{ agent.status.toUpperCase() }}
          </span>
        </div>
        
        <div v-if="agent.task" class="text-sm text-gray-300 mb-3">
          {{ agent.task }}
        </div>
        
        <div v-if="agent.blockReason" class="text-sm text-red-400 mb-3 bg-red-500/10 p-2 rounded">
          ⚠️ {{ agent.blockReason }}
        </div>
        
        <div class="flex justify-between text-xs text-gray-400">
          <span>🪙 {{ agent.tokens }} tokens</span>
          <span>💰 ${{ agent.cost.toFixed(4) }}</span>
          <span>⏱️ {{ agent.runtime }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="agents.length === 0" class="text-center text-gray-500 py-8">
      No active agents. Spawn your first agent to get started! 🚀
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  agents: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['spawnAgent'])

const showSpawnForm = ref(false)
const newAgentTask = ref('')

const handleSpawnAgent = () => {
  if (newAgentTask.value.trim()) {
    emit('spawnAgent', newAgentTask.value)
    newAgentTask.value = ''
    showSpawnForm.value = false
  }
}
</script>
