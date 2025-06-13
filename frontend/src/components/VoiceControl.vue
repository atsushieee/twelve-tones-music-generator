<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Voice {{ voiceId }}</span>
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

      <div class="my-4">
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
          :min="60"
          :max="480"
          :step="10"
          label="Tempo"
          thumb-label="always"
          hide-details
        >
          <template v-slot:thumb-label="{ modelValue }">
            {{ modelValue }}BPM
          </template>
        </v-slider>
      </div>

      <div class="my-4">
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

      <div class="my-4">
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

      <v-row class="my-4">
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

      <div class="my-4">
        <v-slider
          v-model="params.chordProbability"
          :min="0"
          :max="100"
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
    </v-card-text>
  </v-card>
</template>

<script setup>
import { mergeProps, ref, watch } from 'vue'
import * as Tone from 'tone'
import { useWebSocketStore } from '../stores/websocket'

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
      melodicCoherence: 0
    })
  },
})

const emit = defineEmits(['delete', 'update:params', 'play-note', 'fetch-notes'])
const webSocketStore = useWebSocketStore()

// each voice has its own parameters
const params = ref({...props.params})

// watch for props.params changes to update internal params
watch(() => props.params, (newParams) => {
  params.value = { ...newParams }
}, { deep: true })

// manage playing state
const isActive = ref(false)
const nextNoteTime = ref(null)
const schedulerTimer = ref(null)

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
  // update voiceQueue
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
        time: nextNoteTime.value || now
      })
    })
  }

  // calculate the time to play the next note
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

// convert note length to milliseconds
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

// generate note options
const noteOptions = Array.from({ length: 88 }, (_, i) => {
  const midiNumber = i + 21 // A0 (21) ~ C8 (108)
  return {
    title: midiToNoteName(midiNumber),
    value: midiNumber
  }
})

// convert MIDI note number to note name
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

// generate description for note complexity
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