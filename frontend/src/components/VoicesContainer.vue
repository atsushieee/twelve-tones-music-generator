<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h6 d-flex justify-space-between align-center">
        <span>Voices Management</span>
      </v-card-title>
      <v-card-text>
        <v-sheet class="overflow-x-auto">
          <v-row no-gutters class="flex-nowrap">
            <v-col
              v-for="voice in voices"
              :key="voice.id"
              cols="auto"
              class="pa-2"
            >
              <VoiceControl
                ref="voiceRefs"
                :voice-id="voice.id"
                :can-delete="voices.length > 1"
                :global-settings="globalSettings"
                :is-playing="isPlaying"
                @delete="removeVoice(voice.id)"
                @play-note="handlePlayNote"
                @fetch-notes="handleFetchNotes"
                @stop-synth2="handleStopSynth2"
                :params="voice.params"
                @update:params="(newParams) => voice.params = newParams"
                style="width: 400px"
              />
            </v-col>
          </v-row>
        </v-sheet>
        <v-btn
          block
          color="primary"
          class="mt-4"
          @click="showAddVoiceDialog"
        >
          Add Voice
          <v-icon icon="mdi-plus" class="ml-2" />
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Add Voice Modal -->
    <v-dialog v-model="addVoiceDialogVisible" max-width="500">
      <v-card>
        <v-card-title class="text-h6">
          Add New Voice
        </v-card-title>
        <v-card-text>
          <!-- Instrument Selection Section -->
          <div class="mb-6">
            <v-label class="text-subtitle-2 mb-2">Select Instrument</v-label>
            <v-radio-group v-model="selectedInstrument" column>
              <v-radio
                v-for="instrument in availableInstruments"
                :key="instrument.value"
                :label="instrument.title"
                :value="instrument.value"
              >
                <template v-slot:label>
                  <div class="d-flex align-center">
                    <v-icon 
                      :icon="getInstrumentConfig(instrument.value).icon"
                      :color="getInstrumentConfig(instrument.value).color"
                      class="mr-2"
                    />
                    <div>
                      <div class="text-body-1">{{ instrument.title }}</div>
                      <div class="text-caption text-grey-600">
                        {{ getInstrumentConfig(instrument.value).description }}
                      </div>
                    </div>
                    <v-spacer />
                    <v-chip
                      :color="getInstrumentConfig(instrument.value).color"
                      variant="tonal"
                      size="x-small"
                      class="ml-2"
                    >
                      {{ getInstrumentConfig(instrument.value).category }}
                    </v-chip>
                  </div>
                </template>
              </v-radio>
            </v-radio-group>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="addVoiceWithSettings"
          >
            Add
          </v-btn>
          <v-btn
            color="grey"
            @click="addVoiceDialogVisible = false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import VoiceControl from './VoiceControl.vue'
import { useWebSocketStore } from '../stores/websocket'
import { useInstruments } from '../composables/useInstruments'

const { getAvailableInstruments, getInstrumentConfig, getInstrumentSettings } = useInstruments()

const voiceRefs = ref([])
const nextVoiceId = ref(2) // the first voice is 1, so the next is 2
const addVoiceDialogVisible = ref(false)
const selectedRange = ref('middle') // default is middle range
const selectedInstrument = ref('piano') // default is piano

// Get available instruments list
const availableInstruments = getAvailableInstruments()

const props = defineProps({
  globalSettings: {
    type: Object,
    required: true
  },
  isPlaying: {
    type: Boolean,
    required: true
  }
})

const webSocketStore = useWebSocketStore()

// Range settings
const rangeSettings = {
  high: { rangeLower: 76, rangeUpper: 93 },
  middle: { rangeLower: 60, rangeUpper: 76 },
  low: { rangeLower: 48, rangeUpper: 67 }
}

// create initial voice (ID: 1)
const voices = ref([
  {
    id: 1,
    params: {
      velocity: 1.0,
      velocityVariation: 0,
      rangeLower: 60,
      rangeUpper: 76,
      tempo: 240,
      duration: 0,
      rest: false,
      restProbability: 25,
      chordProbability: 0,
      melodicCoherence: 0,
      instrument: 'piano'
    }
  }
])

function showAddVoiceDialog() {
  selectedRange.value = 'middle' // initial value
  selectedInstrument.value = 'piano' // initial value
  addVoiceDialogVisible.value = true
}

function addVoiceWithSettings() {
  addVoiceDialogVisible.value = false
  addVoice(selectedRange.value, selectedInstrument.value)
}

function addVoice(rangeType = 'middle', instrumentType = 'piano') {
  const newVoiceId = nextVoiceId.value
  const rangeConfig = rangeSettings[rangeType]
  
  const newVoiceParams = {
    velocity: 1.0,
    velocityVariation: 0,
    rangeLower: rangeConfig.rangeLower,
    rangeUpper: rangeConfig.rangeUpper,
    tempo: 240,
    duration: 0,
    rest: false,
    restProbability: 25,
    chordProbability: 0,
    melodicCoherence: 0,
    instrument: instrumentType  // set selected instrument
  }
  
  // 選択された楽器の特別設定のデフォルト値を追加
  const instrumentSettings = getInstrumentSettings(instrumentType)
  instrumentSettings.specialSettings.forEach(setting => {
    newVoiceParams[setting.id] = setting.default
  })
  
  voices.value.push({
    id: newVoiceId,
    params: newVoiceParams
  })

  webSocketStore.sendMessage({
    type: 'voice_added',
    voiceId: newVoiceId,
    params: newVoiceParams
  })

  nextVoiceId.value++ // prepare next ID

  // execute after DOM update
  nextTick(() => {
    const newVoiceRef = voiceRefs.value[voiceRefs.value.length - 1]
    if (newVoiceRef && props.isPlaying) {
      newVoiceRef.startPlaying()
    }
  })
}

// Get range description
function getRangeDescription(range) {
  const descriptions = {
    high: 'High Range (E5〜A6)',
    middle: 'Middle Range (C4〜G5)',
    low: 'Low Range (C3〜G4)'
  }
  return descriptions[range] || descriptions.middle
}

// remove voice
function removeVoice(id) {
  if (voices.value.length <= 1) return

  const voiceRef = voiceRefs.value.find(ref => ref && ref.voiceId === id)
  if (voiceRef) {
    voiceRef.stopPlaying()
  }

  emit('stop-synth2', id)

  webSocketStore.sendMessage({
    type: 'voice_removed',
    voiceId: id
  })
  voices.value = voices.value.filter(voice => voice.id !== id)
}

function startAllVoices() {
  voiceRefs.value.forEach(voiceRef => {
    if (voiceRef) {
      voiceRef.startPlaying()
    }
  })
}

function stopAllVoices() {
  voiceRefs.value.forEach(voiceRef => {
    if (voiceRef) {
      voiceRef.stopPlaying()
    }
  })
}

function handlePlayNote(noteData) {
  emit('play-note', noteData)
}

function handleFetchNotes(data) {
  emit('fetch-notes', data)
}

function handleStopSynth2(voiceId) {
  emit('stop-synth2', voiceId)
}

// Function to set voice count and individual settings simultaneously
function setVoiceCountWithSettings(voiceSettings) {
  const targetCount = voiceSettings.length
  const currentCount = voices.value.length
  
  // Adjust voice count as needed
  if (targetCount > currentCount) {
    // Add voices
    const voicesToAdd = targetCount - currentCount
    for (let i = 0; i < voicesToAdd; i++) {
      // Add with default settings (settings will be overwritten later)
      addVoice('middle', 'piano')
    }
  } else if (targetCount < currentCount) {
    // Remove voices
    const finalCount = Math.max(targetCount, 1)
    const voicesToRemove = currentCount - finalCount
    
    for (let i = 0; i < voicesToRemove; i++) {
      if (voices.value.length > 1) {
        const lastVoice = voices.value[voices.value.length - 1]
        removeVoice(lastVoice.id)
      }
    }
  }
  
  // Apply individual settings to each voice
  voiceSettings.forEach((settings, index) => {
    if (index < voices.value.length) {
      voices.value[index].params = { ...settings }
      console.log(`Applied settings to voice ${voices.value[index].id}:`, settings)
    }
  })
  
  console.log(`Voice count and settings applied: ${voices.value.length} voices with individual settings`)
}

const emit = defineEmits(['play-note', 'fetch-notes', 'stop-synth2'])

defineExpose({
  startAllVoices,
  stopAllVoices,
  setVoiceCountWithSettings
})
</script>
