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
      <v-row class="mt-4">
        <v-col cols="6">
          <v-select
            v-model="instrument"
            :items="instruments"
            label="Instrument"
            hide-details
          />
        </v-col>
        <v-col cols="6">
          <v-switch
            v-model="drumEnabled"
            label="Drums"
            color="primary"
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
  dissonanceLevelValue: {
    type: Number,
    default: 1.0
  },
  volumeFactorValue: {
    type: Number,
    default: 1.0
  },
  tempoFactorValue: {
    type: Number,
    default: 1.0
  },
  instrumentValue: {
    type: String,
    default: 'piano'
  }
})

const dissonanceLevel = ref(props.dissonanceLevelValue)
const tempoFactor = ref(props.tempoFactorValue)
const volumeFactor = ref(props.volumeFactorValue)
const instrument = ref(props.instrumentValue)
const instruments = [
  { title: 'Piano', value: 'piano' },
  { title: 'Strings', value: 'violin' }
]
const drumEnabled = ref(false)

watch(() => props.dissonanceLevelValue, (newValue) => {
  dissonanceLevel.value = newValue
})
watch(() => props.volumeFactorValue, (newValue) => {
  volumeFactor.value = newValue
})

watch(() => props.tempoFactorValue, (newValue) => {
  tempoFactor.value = newValue
})

watch(() => props.instrumentValue, (newValue) => {
  instrument.value = newValue
})

watch([dissonanceLevel, tempoFactor, volumeFactor, instrument], () => {
  props.onSettingsChange({
    dissonanceLevel: dissonanceLevel.value,
    tempoFactor: tempoFactor.value,
    volumeFactor: volumeFactor.value,
    instrument: instrument.value
  })
}, { deep: true })
</script> 
