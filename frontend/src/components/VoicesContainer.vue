<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="text-h6">
        Voices Management
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
          @click="addVoice"
        >
          Add Voice
          <v-icon icon="mdi-plus" class="ml-2" />
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import VoiceControl from './VoiceControl.vue'
import { useWebSocketStore } from '../stores/websocket'

const voiceRefs = ref([])
const nextVoiceId = ref(2) // the first voice is 1, so the next is 2

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

// create initial voice (ID: 1)
const voices = ref([
  {
    id: 1,
    params: {
      velocity: 0.5,
      velocityVariation: 75,
      rangeLower: 60,
      rangeUpper: 71,
      tempo: 240,
      duration: 50,
      rest: true,
      restProbability: 25,
      chordProbability: 0,
      melodicCoherence: 0
    }
  }
])

function addVoice() {
  const newVoiceId = nextVoiceId.value
  const newVoiceParams = {
    velocity: 0.5,
    velocityVariation: 75,
    rangeLower: 60,
    rangeUpper: 71,
    tempo: 240,
    duration: 50,
    rest: true,
    restProbability: 25,
    chordProbability: 0,
    melodicCoherence: 0
  }
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

// remove voice
function removeVoice(id) {
  if (voices.value.length <= 1) return

  const voiceRef = voiceRefs.value.find(ref => ref && ref.voiceId === id)
  if (voiceRef) {
    voiceRef.stopPlaying()
  }

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

const emit = defineEmits(['play-note', 'fetch-notes'])

defineExpose({
  startAllVoices,
  stopAllVoices
})
</script> 