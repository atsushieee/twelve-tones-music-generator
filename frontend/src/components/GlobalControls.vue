<template>
  <v-card class="mx-auto pa-2">
    <v-card-title class="text-h6">
      Global Settings
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col>
          <v-slider
            v-model="dissonanceLevel"
            :min="0"
            :max="1"
            :step="0.01"
            label="Dissonance Level"
            thumb-label="always"
            hide-details
          />
        </v-col>
        <v-col>
          <v-slider
            v-model="tempoFactor"
            :min="0.5"
            :max="2.0"
            :step="0.1"
            label="Tempo Factor"
            thumb-label="always"
            hide-details
          />
        </v-col>
        <v-col>
          <v-slider
            v-model="volumeFactor"
            :min="0.5"
            :max="2.0"
            :step="0.1"
            label="Volume Factor"
            thumb-label="always"
            hide-details
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  onSettingsChange: {
    type: Function,
    required: true
  },
  volumeFactorValue: {
    type: Number,
    default: 1.0
  }
})

const dissonanceLevel = ref(1.0)
const tempoFactor = ref(1.0)
const volumeFactor = ref(props.volumeFactorValue)

watch(() => props.volumeFactorValue, (newValue) => {
  volumeFactor.value = newValue
})

watch([dissonanceLevel, tempoFactor, volumeFactor], () => {
  props.onSettingsChange({
    dissonanceLevel: dissonanceLevel.value,
    tempoFactor: tempoFactor.value,
    volumeFactor: volumeFactor.value
  })
}, { deep: true })
</script> 
