<template>
  <v-card class="mb-4">
    <v-card-title>Presets</v-card-title>
    <v-card-text>
      <v-select
        v-model="selectedPreset"
        :items="presetOptions"
        item-title="name"
        item-value="value"
        label="Select a Preset"
        @update:modelValue="handlePresetChange"
        return-object
        outlined
        dense
      ></v-select>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  voicesContainer: {
    type: Object,
    required: true
  },
  tonePlayer: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['settings-change'])

const presets = [
  {
    name: 'Default',
    value: { 
      dissonanceLevel: 1.0, 
      tempoFactor: 1.0, 
      volumeFactor: 1.0, 
      instrument: 'piano', 
      voices: [
        {
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
      ]
    }
  },
  {
    name: 'Calm and Quiet',
    value: { 
      dissonanceLevel: 0.05, 
      tempoFactor: 0.5, 
      volumeFactor: 0.8, 
      instrument: 'piano', 
      voices: [
        {
          velocity: 1.0,
          velocityVariation: 30,
          rangeLower: 60,
          rangeUpper: 76,
          tempo: 180,
          duration: 25,
          rest: true,
          restProbability: 40,
          chordProbability: 0,
          melodicCoherence: 0
        },
        {
          velocity: 1.0,
          velocityVariation: 30,
          rangeLower: 60,
          rangeUpper: 76,
          tempo: 180,
          duration: 25,
          rest: true,
          restProbability: 40,
          chordProbability: 0,
          melodicCoherence: 0
        }
      ]
    }
  }
]

const selectedPreset = ref(presets[0])
const presetOptions = computed(() => presets.map(p => ({ name: p.name, value: p.name })))

const handlePresetChange = (presetSelection) => {
  const foundPreset = presets.find(p => p.name === presetSelection.value)
  if (foundPreset) {
    selectedPreset.value = foundPreset
    applyPreset(foundPreset)
  }
}

const applyPreset = (foundPreset) => {
  const { voices, ...settingsOnly } = foundPreset.value
  
  // 親コンポーネントに設定変更を通知
  emit('settings-change', settingsOnly)
  
  if (foundPreset.value.instrument) {
    props.tonePlayer.setInstrument(foundPreset.value.instrument)
  }
  
  if (props.voicesContainer && foundPreset.value.voices) {
    props.voicesContainer.setVoiceCountWithSettings(foundPreset.value.voices)
  }
}
</script>

    props.voicesContainer.setVoiceCountWithSettings(foundPreset.value.voices)