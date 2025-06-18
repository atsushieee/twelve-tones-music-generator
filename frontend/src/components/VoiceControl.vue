<template>
  <v-card 
    class="mb-4"
    :style="{ borderLeft: `4px solid ${instrumentConfig.color}` }"
  >
    <v-card-title 
      class="d-flex justify-space-between align-center"
      :style="{ backgroundColor: instrumentConfig.bgColor }"
    >
      <div class="d-flex align-center">
        <v-icon 
          :icon="instrumentConfig.icon" 
          :color="instrumentConfig.color"
          class="mr-2"
          size="24"
        />
        <div>
          <span class="text-h6">Voice {{ voiceId }}</span>
          <div class="text-caption text-grey-600">
            {{ instrumentConfig.displayName }}
          </div>
        </div>
      </div>
      <v-btn
        icon="mdi-close"
        variant="text"
        density="comfortable"
        @click="$emit('delete')"
        :disabled="!canDelete"
      />
    </v-card-title>

    <v-card-text>
      <div class="my-4">
        <v-row>
          <v-col cols="8">
            <v-select
              v-model="params.instrument"
              :items="availableInstruments"
              label="Instrument"
              hide-details
              variant="outlined"
              density="compact"
            >
              <template v-slot:selection="{ item }">
                <v-chip
                  :color="getInstrumentInfo(item.value).color"
                  variant="tonal"
                  size="small"
                >
                  <v-icon 
                    :icon="getInstrumentInfo(item.value).icon" 
                    start 
                    size="16"
                  />
                  {{ item.title }}
                </v-chip>
              </template>
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-icon 
                      :icon="getInstrumentInfo(item.value).icon"
                      :color="getInstrumentInfo(item.value).color"
                    />
                  </template>
                  <v-list-item-subtitle>
                    {{ getInstrumentInfo(item.value).description }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
          <v-col cols="4">
            <v-chip
              :color="instrumentConfig.color"
              variant="flat"
              class="ma-1"
              size="small"
            >
              {{ instrumentConfig.category }}
            </v-chip>
          </v-col>
        </v-row>
      </div>

      <div class="my-4">
        <v-slider
          v-model="params.velocity"
          :min="0"
          :max="1"
          :step="0.1"
          label="Volume"
          thumb-label="always"
          hide-details
        />
      </div>

      <div class="my-4" v-if="instrumentSettings.showVelocityVariation">
        <v-slider
          v-model="params.velocityVariation"
          :min="0"
          :max="100"
          :step="5"
          label="Volume Variation"
          thumb-label="always"
          hide-details
        >
          <template v-slot:thumb-label="{ modelValue }">
            {{ modelValue }}%
          </template>
        </v-slider>
      </div>

      <div class="my-4">
        <v-slider
          v-model="params.tempo"
          :min="instrumentSettings.minTempo"
          :max="instrumentSettings.maxTempo"
          :step="instrumentSettings.tempoStep"
          label="Tempo"
          thumb-label="always"
          hide-details
        >
          <template v-slot:thumb-label="{ modelValue }">
            {{ modelValue }}BPM
          </template>
        </v-slider>
      </div>

      <div class="my-4" v-if="instrumentSettings.showComplexity">
        <v-slider
          v-model="params.duration"
          :min="0"
          :max="100"
          :step="5"
          label="Complexity"
          thumb-label="always"
          hide-details
        >
          <template v-slot:thumb-label="{ modelValue }">
            {{ modelValue }}%
          </template>
        </v-slider>
        <div class="text-caption text-grey">
          {{ getDurationDescription(params.duration) }}
        </div>
      </div>

      <div class="my-4" v-if="instrumentSettings.showRange">
        <v-row>
          <v-col cols="6">
            <v-select
              v-model="params.rangeLower"
              :items="noteOptions"
              label="Range (Lower)"
              hide-details
              @update:model-value="handleRangeChange"
            />
          </v-col>
          <v-col cols="6">
            <v-select
              v-model="params.rangeUpper"
              :items="noteOptions"
              label="Range (Upper)"
              hide-details
              @update:model-value="handleRangeChange"
            />
          </v-col>
        </v-row>
      </div>

      <v-row class="my-4" v-if="instrumentSettings.showRest">
        <v-col cols="4">
          <v-switch
            v-model="params.rest"
            label="Rest"
            hide-details
            :color="params.rest ? 'green' : ''"
          />
        </v-col>
        <v-col cols="8">
          <v-slider
            v-model="params.restProbability"
            :min="10"
            :max="50"
            :step="5"
            label="Probability"
            thumb-label="always"
            hide-details
            :disabled="!params.rest"
          >
            <template v-slot:thumb-label="{ modelValue }">
              {{ modelValue }}%
            </template>
          </v-slider>
        </v-col>
      </v-row>

      <div class="my-4" v-if="instrumentSettings.showChordProbability">
        <v-slider
          v-model="params.chordProbability"
          :min="0"
          :max="instrumentSettings.chordProbabilityMax"
          :step="5"
          label="Simultaneity Probability"
          thumb-label="always"
          hide-details
        >
          <template v-slot:thumb-label="{ modelValue }">
            {{ modelValue }}%
          </template>
        </v-slider>
        <div class="text-caption text-grey">
          {{ getChordProbabilityDescription(params.chordProbability) }}
        </div>
      </div>

      <!-- Instrument-specific settings -->
      <div v-if="instrumentSettings.specialSettings.length > 0" class="mt-6">
        <v-divider class="mb-4"></v-divider>
        <div class="text-subtitle-2 mb-3 font-weight-bold" :style="{ color: instrumentConfig.color }">
          {{ instrumentConfig.displayName }} Settings
        </div>
        
        <div 
          v-for="setting in instrumentSettings.specialSettings" 
          :key="setting.id" 
          class="my-4"
        >
          <!-- Select type setting -->
          <v-select
            v-if="setting.type === 'select'"
            v-model="params[setting.id]"
            :items="setting.options"
            :label="setting.label"
            hide-details
            variant="outlined"
            density="compact"
          />
          
          <!-- Switch type setting -->
          <v-switch
            v-else-if="setting.type === 'switch'"
            v-model="params[setting.id]"
            :label="setting.label"
            hide-details
            :color="instrumentConfig.color"
          />
          
          <!-- Slider type setting -->
          <div v-else-if="setting.type === 'slider'">
            <v-slider
              v-model="params[setting.id]"
              :min="setting.min"
              :max="setting.max"
              :step="setting.step"
              :label="setting.label"
              thumb-label="always"
              hide-details
              :disabled="setting.dependsOn ? !params[setting.dependsOn] : false"
            >
              <template v-slot:thumb-label="{ modelValue }">
                {{ modelValue }}{{ setting.unit || '' }}
              </template>
            </v-slider>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { mergeProps, ref, watch, computed } from 'vue'
import * as Tone from 'tone'
import { useWebSocketStore } from '../stores/websocket'
import { useInstruments } from '../composables/useInstruments'

const { getAvailableInstruments, getInstrumentInfo, getInstrumentConfig, getInstrumentSettings } = useInstruments()

const props = defineProps({
  voiceId: {
    type: Number,
    required: true
  },
  canDelete: {
    type: Boolean,
    default: true
  },
  globalSettings: {
    type: Object,
    required: true
  },
  params: {
    type: Object,
    default: () => ({
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
    })
  },
})

const emit = defineEmits(['delete', 'update:params', 'play-note', 'fetch-notes'])
const webSocketStore = useWebSocketStore()

// Each voice has its own parameters
const params = ref({...props.params})

// Watch for props.params changes to update internal params
watch(() => props.params, (newParams) => {
  params.value = { ...newParams }
}, { deep: true })

// Manage playing state
const isActive = ref(false)
const nextNoteTime = ref(null)
const schedulerTimer = ref(null)

// Get available instruments list
const availableInstruments = getAvailableInstruments()

// Current selected instrument configuration
const instrumentConfig = computed(() => {
  return getInstrumentConfig(params.value.instrument)
})

// Current selected instrument detailed settings
const instrumentSettings = computed(() => {
  return getInstrumentSettings(params.value.instrument)
})

// Handle instrument change
watch(() => params.value.instrument, (newInstrument, oldInstrument) => {
  if (newInstrument !== oldInstrument) {
    const settings = getInstrumentSettings(newInstrument)
    
    // Apply default range
    if (settings.defaultRange) {
      params.value.rangeLower = settings.defaultRange.lower
      params.value.rangeUpper = settings.defaultRange.upper
    }
    
    // Set instrument-specific default values
    settings.specialSettings.forEach(setting => {
      if (!(setting.id in params.value)) {
        params.value[setting.id] = setting.default
      }
    })
    
    // Adjust chord probability
    if (params.value.chordProbability > settings.chordProbabilityMax) {
      params.value.chordProbability = settings.chordProbabilityMax
    }
  }
})

function startPlaying() {
  isActive.value = true
  nextNoteTime.value = null
  fetchNotesIfNeeded()
  scheduleNextNote()
}

function stopPlaying() {
  isActive.value = false
  if (schedulerTimer.value) {
    clearTimeout(schedulerTimer.value)
    schedulerTimer.value = null
  }
  webSocketStore.clearVoiceQueue(props.voiceId)
}

function scheduleNextNote() {
  if (!isActive.value) return

  const voiceQueue = webSocketStore.getVoiceQueue(props.voiceId)
  if (voiceQueue.length === 0) {
    schedulerTimer.value = setTimeout(() => scheduleNextNote(), 100)
    return
  }

  const noteData = voiceQueue.shift()
  // Update voiceQueue
  webSocketStore.updateVoiceQueue(props.voiceId, voiceQueue)

  if (noteData.notes && noteData.notes.length > 0) {
    const now = Tone.now()
    noteData.notes.forEach(note => {
      const noteName = Tone.Frequency(note, "midi").toNote()
      const adjustedVelocity = noteData.velocity * props.globalSettings.volumeFactor
      emit('play-note', {
        voiceId: props.voiceId,
        noteName,
        duration: noteData.duration,
        velocity: adjustedVelocity,
        time: nextNoteTime.value || now,
        instrument: params.value.instrument
      })
    })
  }

  // Calculate the time to play the next note
  const duration = getDurationInMilliseconds(noteData.duration, params.value.tempo * props.globalSettings.tempoFactor)
  nextNoteTime.value = Tone.now() + (duration / 1000)

  schedulerTimer.value = setTimeout(() => scheduleNextNote(), duration)
}

function fetchNotesIfNeeded() {
  if (!isActive.value) return

  const minQueueLength = 5
  const voiceQueue = webSocketStore.getVoiceQueue(props.voiceId)
  if (voiceQueue.length < minQueueLength) {
    const notesToFetch = minQueueLength - voiceQueue.length
    emit('fetch-notes', {
      voiceId: props.voiceId,
      params: params.value,
      duration: notesToFetch
    })
  }

  setTimeout(() => fetchNotesIfNeeded(), 100)
}

function getVoiceQueue(voiceId) {
  return webSocketStore.getVoiceQueue(voiceId)
}

// Convert note length to milliseconds
function getDurationInMilliseconds(duration, tempo) {
  const durationMap = {
    '2n': 2,
    '4n': 1,
    '8n': 0.5,
    '16n': 0.25,
    '32n': 0.125
  }
  
  const beats = durationMap[duration] || 1
  return (60000 / tempo) * beats
}

// Generate note options
const noteOptions = Array.from({ length: 88 }, (_, i) => {
  const midiNumber = i + 21 // A0 (21) ~ C8 (108)
  return {
    title: midiToNoteName(midiNumber),
    value: midiNumber
  }
})

// Convert MIDI note number to note name
function midiToNoteName(midi) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const note = noteNames[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${note}${octave}`
}

function handleRangeChange() {
  if (params.value.rangeLower > params.value.rangeUpper) {
    if (params.value.rangeLower !== props.voiceId) {
      params.value.rangeLower = params.value.rangeUpper
    } else {
      params.value.rangeUpper = params.value.rangeLower
    }
  }
}

function getChordProbabilityDescription(value) {
  if (value === 0) return '1 note only'
  if (value <= 50) return '1 or 2 notes'
  return '1 or 2 or 3 notes'
}

// Generate description for note complexity
function getDurationDescription(value) {
  if (value <= 0) {
    return "half note only"
  } else if (value <= 25) {
    return "half or quarter note"
  } else if (value <= 50) {
    return "half, quarter or eighth note"
  } else if (value <= 75) {
    return "half, quarter, eighth or sixteenth note"
  } else {
    return "half, quarter, eighth, sixteenth or thirty-second note"
  }
}

defineExpose({
  startPlaying,
  stopPlaying
})
</script> 