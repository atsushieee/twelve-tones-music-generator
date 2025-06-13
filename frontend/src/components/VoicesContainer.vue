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
          @click="showRangeDialog"
        >
          Add Voice
          <v-icon icon="mdi-plus" class="ml-2" />
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- 音域選択モーダル -->
    <v-dialog v-model="rangeDialogVisible" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          声部の音域を選択
        </v-card-title>
        <v-card-text>
          <v-radio-group v-model="selectedRange">
            <v-radio
              label="高音域 (E5〜A6)"
              value="high"
            ></v-radio>
            <v-radio
              label="中音域 (C4〜G5)"
              value="middle"
            ></v-radio>
            <v-radio
              label="低音域 (C3〜G4)"
              value="low"
            ></v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="addVoiceWithSelectedRange"
          >
            追加
          </v-btn>
          <v-btn
            color="grey"
            @click="rangeDialogVisible = false"
          >
            キャンセル
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

const voiceRefs = ref([])
const nextVoiceId = ref(2) // the first voice is 1, so the next is 2
const rangeDialogVisible = ref(false)
const selectedRange = ref('middle') // デフォルトは中音域

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

// 音域ごとの設定
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
      melodicCoherence: 0
    }
  }
])

function showRangeDialog() {
  selectedRange.value = 'middle' // 初期値
  rangeDialogVisible.value = true
}

function addVoiceWithSelectedRange() {
  rangeDialogVisible.value = false
  addVoice(selectedRange.value)
}

function addVoice(rangeType = 'middle') {
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


// 声部数と個別設定を同時に適用する関数
function setVoiceCountWithSettings(voiceSettings) {
  const targetCount = voiceSettings.length
  const currentCount = voices.value.length
  
  // 必要に応じて声部数を調整
  if (targetCount > currentCount) {
    // 声部を追加
    const voicesToAdd = targetCount - currentCount
    for (let i = 0; i < voicesToAdd; i++) {
      addVoice('middle') // デフォルトの音域で追加（後で設定を上書き）
    }
  } else if (targetCount < currentCount) {
    // 声部を削除
    const finalCount = Math.max(targetCount, 1)
    const voicesToRemove = currentCount - finalCount
    
    for (let i = 0; i < voicesToRemove; i++) {
      if (voices.value.length > 1) {
        const lastVoice = voices.value[voices.value.length - 1]
        removeVoice(lastVoice.id)
      }
    }
  }
  
  // 各声部に個別設定を適用
  voiceSettings.forEach((settings, index) => {
    if (index < voices.value.length) {
      voices.value[index].params = { ...settings }
      console.log(`Applied settings to voice ${voices.value[index].id}:`, settings)
    }
  })
  
  console.log(`Voice count and settings applied: ${voices.value.length} voices with individual settings`)
}

const emit = defineEmits(['play-note', 'fetch-notes'])

defineExpose({
  startAllVoices,
  stopAllVoices,
  setVoiceCountWithSettings
})
</script>