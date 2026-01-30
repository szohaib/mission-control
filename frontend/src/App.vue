<template>
  <div>
    <!-- Login Screen -->
    <LoginScreen v-if="!authenticated" @login="handleLogin" />
    
    <!-- Main Dashboard -->
    <div v-else class="min-h-screen p-4">
      <div class="max-w-[1920px] mx-auto space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-cyan-400">⚡ MISSION CONTROL DASHBOARD</h1>
            <p class="text-sm text-gray-400">Real-time Agent Orchestration System</p>
          </div>
          <button @click="handleLogout" class="btn-secondary text-sm">
            🚪 Logout
          </button>
        </div>
        
        <!-- Squad Leader Panel -->
        <SquadLeaderPanel :squad-leader="squadLeader" :ws-connected="connected" />
        
        <!-- Main Grid Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Left Column: Agent Status (2/3 width) -->
          <div class="lg:col-span-2 space-y-4">
            <AgentStatusBoard :agents="agents" @spawn-agent="spawnAgent" />
            <KanbanBoard
              :missions="missions"
              @create-mission="createMission"
              @move-mission="moveMission"
            />
          </div>
          
          <!-- Right Column: Activity Feed (1/3 width) -->
          <div class="lg:col-span-1">
            <div class="sticky top-4">
              <ActivityFeed :activities="activityFeed" />
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="text-center text-xs text-gray-600 mt-8">
          <p>Mission Control v1.0.0 • NASA meets Stark Industries™</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWebSocket } from './composables/useWebSocket'
import LoginScreen from './components/LoginScreen.vue'
import SquadLeaderPanel from './components/SquadLeaderPanel.vue'
import AgentStatusBoard from './components/AgentStatusBoard.vue'
import KanbanBoard from './components/KanbanBoard.vue'
import ActivityFeed from './components/ActivityFeed.vue'

const authenticated = ref(false)

const {
  connected,
  agents,
  missions,
  activityFeed,
  squadLeader,
  spawnAgent,
  createMission,
  moveMission
} = useWebSocket()

// Update squad leader stats based on agents
const activeAgentsCount = computed(() => {
  return agents.value.filter(a => a.status === 'working').length
})

// Watch agents and update squad leader
import { watch } from 'vue'
watch(activeAgentsCount, (newCount) => {
  squadLeader.value.activeAgents = newCount
}, { immediate: true })

const handleLogin = () => {
  authenticated.value = true
}

const handleLogout = () => {
  authenticated.value = false
}
</script>

<style>
@import './style.css';
</style>
