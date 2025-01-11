<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col>
            <h1 class="text-h3 text-center mb-6">Twelve Tone Music Generator</h1>
            
            <v-alert
              :color="isConnected ? 'success' : 'warning'"
              :icon="isConnected ? 'mdi-check-circle' : 'mdi-alert'"
              class="mb-4"
            >
              Connection: {{ isConnected ? 'Connected' : 'Disconnected' }}
            </v-alert>

            <v-card class="mb-4">
              <v-card-text class="d-flex justify-center">
                <v-btn
                  :color="isPlaying ? 'error' : 'success'"
                  size="large"
                  class="mx-2"
                  :disabled="!isConnected"
                  @click="togglePlay"
                >
                  <v-icon :icon="isPlaying ? 'mdi-stop' : 'mdi-play'" class="mr-2" />
                  {{ isPlaying ? 'Stop' : 'Play' }}
                </v-btn>
              </v-card-text>
            </v-card>

            <GlobalControls
              :onSettingsChange="handleSettingsChange"
              class="mb-4"
            />

            <VoicesContainer
              ref="voicesContainer"
              class="mb-4"
              :global-settings="globalSettings"
              :is-playing="isPlaying"
              @play-note="handlePlayNote"
              @fetch-notes="handleFetchNotes"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as Tone from 'tone'
import { useWebSocketStore } from './stores/websocket'
import GlobalControls from './components/GlobalControls.vue'
import VoicesContainer from './components/VoicesContainer.vue'

const webSocketStore = useWebSocketStore()
const isConnected = computed(() => webSocketStore.isConnected)

onMounted(async () => {
  console.log('App mounted, initializing WebSocket connection')
  try {
    await webSocketStore.connectWebSocket()
    console.log('WebSocket connection initialized')
  } catch (error) {
    console.error('Failed to initialize WebSocket connection:', error)
  }
})

const voicesContainer = ref(null)
const isPlaying = ref(false)
const synth = new Tone.PolySynth().toDestination()
const globalSettings = ref({
  dissonanceLevel: 1.0,
  tempoFactor: 1.0,
  volumeFactor: 1.0
})

const handleSettingsChange = (settings) => {
  globalSettings.value = settings
}

async function togglePlay() {
  if (!voicesContainer.value) return

  if (isPlaying.value) {
    voicesContainer.value.stopAllVoices()
    isPlaying.value = false
  } else {
    await Tone.start()
    voicesContainer.value.startAllVoices()
    isPlaying.value = true
  }
}

function handlePlayNote(noteData) {
  const { noteName, duration, velocity, time } = noteData
  synth.triggerAttackRelease(
    noteName,
    duration,
    time,
    velocity
  )
}

// Request note generation from backend via WebSocket
function handleFetchNotes(data) {
  webSocketStore.sendMessage({
    type: 'generate_notes',
    voiceId: data.voiceId,
    params: data.params,
    duration: data.duration,
    globalParams: globalSettings.value
  })
}
</script>
