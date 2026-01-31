<template>
  <div class="panel">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xl font-bold text-cyan-400">📋 Mission Queue</h3>
      <button @click="showCreateForm = !showCreateForm" class="btn-primary text-sm">
        ➕ Create Mission
      </button>
    </div>
    
    <!-- Create Mission Form -->
    <div v-if="showCreateForm" class="mb-4 p-4 bg-mission-darker rounded border border-cyan-500/30">
      <h4 class="text-sm font-bold text-cyan-400 mb-2">Create New Mission</h4>
      <form @submit.prevent="handleCreateMission" class="space-y-2">
        <input
          v-model="newMission.title"
          type="text"
          placeholder="Mission title..."
          class="w-full bg-mission-dark border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
        />
        <textarea
          v-model="newMission.description"
          placeholder="Mission description..."
          rows="2"
          class="w-full bg-mission-dark border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
        ></textarea>
        <select
          v-model="newMission.priority"
          class="w-full bg-mission-dark border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        <div class="flex space-x-2">
          <button type="submit" class="btn-primary text-sm">Create</button>
          <button type="button" @click="showCreateForm = false" class="btn-secondary text-sm">Cancel</button>
        </div>
      </form>
    </div>
    
    <!-- Kanban Columns -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div v-for="(column, key) in columns" :key="key">
        <div class="mb-2 flex items-center justify-between">
          <h4 class="font-bold text-sm" :class="column.color">
            {{ column.icon }} {{ column.title }}
          </h4>
          <span class="text-xs text-gray-500">{{ missions[key]?.length || 0 }}</span>
        </div>
        
        <draggable
          :list="missions[key]"
          :group="{ name: 'missions', pull: true, put: true }"
          @change="(evt) => handleDragChange(evt, key)"
          class="kanban-column"
          item-key="id"
        >
          <template #item="{ element }">
            <div class="mission-card" @click="selectMission(element)">
              <div class="flex items-start justify-between mb-2">
                <h5 class="font-semibold text-sm text-white">{{ element.title }}</h5>
                <span
                  class="text-xs px-2 py-0.5 rounded"
                  :class="{
                    'bg-red-500/20 text-red-400': element.priority === 'high',
                    'bg-yellow-500/20 text-yellow-400': element.priority === 'medium',
                    'bg-gray-500/20 text-gray-400': element.priority === 'low'
                  }"
                >
                  {{ element.priority }}
                </span>
              </div>
              <p class="text-xs text-gray-400 mb-2">{{ element.description }}</p>
              <div v-if="element.assignedTo" class="text-xs text-cyan-400">
                👤 {{ element.assignedTo }}
              </div>
              <div v-if="element.comments?.length" class="text-xs text-yellow-400 mt-1">
                💬 {{ element.comments.length }} comment(s)
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>
    
    <!-- Mission Detail Modal -->
    <div
      v-if="selectedMission"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="selectedMission = null"
    >
      <div class="panel w-full max-w-2xl m-4">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-xl font-bold text-white">{{ selectedMission.title }}</h3>
            <span
              class="text-xs px-2 py-1 rounded mt-1 inline-block"
              :class="{
                'bg-red-500/20 text-red-400': selectedMission.priority === 'high',
                'bg-yellow-500/20 text-yellow-400': selectedMission.priority === 'medium',
                'bg-gray-500/20 text-gray-400': selectedMission.priority === 'low'
              }"
            >
              {{ selectedMission.priority }} priority
            </span>
          </div>
          <button @click="selectedMission = null" class="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <p class="text-gray-300 mb-4">{{ selectedMission.description }}</p>
        
        <div v-if="selectedMission.assignedTo" class="mb-4 text-sm text-cyan-400">
          👤 Assigned to: {{ selectedMission.assignedTo }}
        </div>
        
        <div v-if="selectedMission.comments?.length" class="mb-4">
          <h4 class="text-sm font-bold text-cyan-400 mb-2">💬 Comments</h4>
          <div v-for="(comment, idx) in selectedMission.comments" :key="idx" class="text-sm text-gray-300 mb-1">
            • {{ comment }}
          </div>
        </div>
        
        <div class="border-t border-gray-700 pt-4">
          <h4 class="text-sm font-bold text-cyan-400 mb-2">Send Back to Agent</h4>
          <textarea
            v-model="feedbackComment"
            placeholder="Add feedback or instructions..."
            rows="3"
            class="w-full bg-mission-darker border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 mb-2"
          ></textarea>
          <button @click="sendBackToAgent" class="btn-primary text-sm">
            🔄 Send Back with Feedback
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import draggable from 'vuedraggable'

const props = defineProps({
  missions: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['createMission', 'moveMission'])

const columns = {
  backlog: { title: 'Backlog', icon: '📥', color: 'text-gray-400' },
  inProgress: { title: 'In Progress', icon: '⚙️', color: 'text-cyan-400' },
  review: { title: 'Review', icon: '👀', color: 'text-yellow-400' },
  done: { title: 'Done', icon: '✅', color: 'text-green-400' }
}

const showCreateForm = ref(false)
const newMission = reactive({
  title: '',
  description: '',
  priority: 'medium'
})

const selectedMission = ref(null)
const feedbackComment = ref('')

const handleCreateMission = () => {
  if (newMission.title.trim()) {
    emit('createMission', { ...newMission, id: `m${Date.now()}` })
    newMission.title = ''
    newMission.description = ''
    newMission.priority = 'medium'
    showCreateForm.value = false
  }
}

const handleDragChange = (evt, columnKey) => {
  if (evt.added) {
    const mission = evt.added.element
    emit('moveMission', mission.id, columnKey)
  }
}

const selectMission = (mission) => {
  selectedMission.value = mission
  feedbackComment.value = ''
}

const sendBackToAgent = () => {
  if (feedbackComment.value.trim()) {
    emit('moveMission', selectedMission.value.id, 'inProgress', feedbackComment.value)
    selectedMission.value = null
    feedbackComment.value = ''
  }
}
</script>
