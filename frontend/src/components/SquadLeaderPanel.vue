<template>
  <div class="panel">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div class="text-4xl">👩‍🚀</div>
        <div>
          <h2 class="text-2xl font-bold text-cyan-400">{{ squadLeader.name }}</h2>
          <p class="text-sm text-gray-400">Squad Leader • Mission Control</p>
        </div>
      </div>
      
      <div class="flex space-x-6">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-400">{{ squadLeader.activeAgents }}</div>
          <div class="text-xs text-gray-400">Active Agents</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-cyan-400">{{ squadLeader.tasksCompleted }}</div>
          <div class="text-xs text-gray-400">Tasks Completed</div>
        </div>
        <div class="text-center">
          <div class="flex items-center space-x-2">
            <span class="status-indicator" :class="wsConnected ? 'status-working' : 'status-blocked'"></span>
            <span class="text-xs" :class="wsConnected ? 'text-green-400' : 'text-red-400'">
              {{ wsConnected ? 'CONNECTED' : 'OFFLINE' }}
            </span>
          </div>
          <div class="text-xs text-gray-400">System Status</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  squadLeader: {
    type: Object,
    required: true
  },
  wsConnected: {
    type: Boolean,
    default: false
  }
})
</script>
