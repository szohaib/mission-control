<template>
  <div class="panel h-full flex flex-col">
    <h3 class="text-xl font-bold text-cyan-400 mb-4">📡 Live Activity Feed</h3>
    
    <div class="flex-1 overflow-y-auto space-y-2">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="p-3 rounded text-sm border-l-4"
        :class="{
          'bg-green-500/10 border-green-500': activity.level === 'success',
          'bg-blue-500/10 border-blue-500': activity.level === 'info',
          'bg-yellow-500/10 border-yellow-500': activity.level === 'warning',
          'bg-red-500/10 border-red-500': activity.level === 'error'
        }"
      >
        <div class="flex items-start justify-between mb-1">
          <span class="font-semibold" :class="{
            'text-green-400': activity.level === 'success',
            'text-cyan-400': activity.level === 'info',
            'text-yellow-400': activity.level === 'warning',
            'text-red-400': activity.level === 'error'
          }">
            {{ activity.source }}
          </span>
          <span class="text-xs text-gray-500">{{ formatTime(activity.timestamp) }}</span>
        </div>
        <p class="text-gray-300">{{ activity.message }}</p>
      </div>
    </div>
    
    <div v-if="activities.length === 0" class="flex-1 flex items-center justify-center text-gray-500">
      No activity yet...
    </div>
  </div>
</template>

<script setup>
defineProps({
  activities: {
    type: Array,
    default: () => []
  }
})

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
