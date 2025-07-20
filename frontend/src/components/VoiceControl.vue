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

      <!-- Volume -->
      <div v-if="instrumentSettings.volume" class="my-4">
        <v-divider class="mb-3"></v-divider>
        <div class="text-subtitle-2 mb-3 font-weight-bold" :style="{ color: instrumentConfig.color }">
          Volume Settings
        </div>
        
        <div v-for="config in volumeUIConfig" :key="config.key" class="my-3">
          <!-- Slider type -->
          <v-slider
            v-if="config.type === 'slider'"
            :model-value="volumeValues[config.key]"
            @update:model-value="(value) => updateVolumeParam(config.key, value)"
            :min="config.min"
            :max="config.max"
            :step="config.step"
            :label="config.label"
            thumb-label="always"
            hide-details
          >
            <template v-if="config.unit === 'percent'" v-slot:thumb-label="{ modelValue }">
              {{ modelValue }}%
            </template>
          </v-slider>
        </div>
      </div>

      <!-- Tempo -->
      <div v-if="instrumentSettings.tempo" class="my-4">
        <v-divider class="mb-3"></v-divider>
        <div class="text-subtitle-2 mb-3 font-weight-bold" :style="{ color: instrumentConfig.color }">
          Tempo Settings
        </div>
        
        <div v-for="config in tempoUIConfig" :key="config.key" class="my-3">
          <!-- Slider type -->
          <v-slider
            v-if="config.type === 'slider'"
            :model-value="tempoValues[config.key]"
            @update:model-value="(value) => updateTempoParam(config.key, value)"
            :min="config.min"
            :max="config.max"
            :step="config.step"
            :label="config.label"
            thumb-label="always"
            hide-details
          >
            <template v-if="config.unit === 'bpm'" v-slot:thumb-label="{ modelValue }">
              {{ modelValue }}BPM
            </template>
            <template v-else-if="config.unit === 'percent'" v-slot:thumb-label="{ modelValue }">
              {{ modelValue }}%
            </template>
          </v-slider>
        </div>
      </div>

      <!-- Pitch -->
      <div v-if="instrumentSettings.pitch" class="my-4">
        <v-divider class="mb-3"></v-divider>
        <div class="text-subtitle-2 mb-3 font-weight-bold" :style="{ color: instrumentConfig.color }">
          Pitch Settings
        </div>
        
        <div v-for="config in pitchUIConfig" :key="config.key" class="my-3">
          <!-- Group type (for 2-column layout) -->
          <template v-if="config.type === 'group' && config.layout === 'columns'">
            <v-row align="center">
              <v-col 
                v-for="item in config.items" 
                :key="item.key" 
                :cols="typeof item.col === 'number' ? item.col : 6"
              >
                <!-- Select type -->
                <v-select
                  v-if="item.type === 'select'"
                  :model-value="pitchValues[item.key]"
                  @update:model-value="(value) => updatePitchParam(item.key, value)"
                  :items="item.options"
                  :label="item.label"
                  hide-details
                />
                
                <!-- Slider type -->
                <v-slider
                  v-else-if="item.type === 'slider'"
                  :model-value="pitchValues[item.key]"
                  @update:model-value="(value) => updatePitchParam(item.key, value)"
                  :min="item.min"
                  :max="item.max"
                  :step="item.step"
                  :label="item.label"
                  thumb-label="always"
                  hide-details
                >
                  <template v-if="item.unit === 'hz'" v-slot:thumb-label="{ modelValue }">
                    {{ modelValue }}Hz
                  </template>
                </v-slider>
              </v-col>
            </v-row>
          </template>
          
          <!-- Regular single controls -->
          <template v-else>
            <!-- Select type -->
            <v-select
              v-if="config.type === 'select'"
              :model-value="pitchValues[config.key]"
              @update:model-value="(value) => updatePitchParam(config.key, value)"
              :items="config.options"
              :label="config.label"
              hide-details
            />
            
            <!-- Slider type -->
            <v-slider
              v-else-if="config.type === 'slider'"
              :model-value="pitchValues[config.key]"
              @update:model-value="(value) => updatePitchParam(config.key, value)"
              :min="config.min"
              :max="config.max"
              :step="config.step"
              :label="config.label"
              thumb-label="always"
              hide-details
            >
              <template v-if="config.unit === 'hz'" v-slot:thumb-label="{ modelValue }">
                {{ modelValue }}Hz
              </template>
            </v-slider>
          </template>
        </div>
      </div>

      <!-- Rhythm -->
      <div v-if="instrumentSettings.rhythm" class="my-4">
        <v-divider class="mb-3"></v-divider>
        <div class="text-subtitle-2 mb-3 font-weight-bold" :style="{ color: instrumentConfig.color }">
          Rhythm Settings
        </div>
        
        <div v-for="config in rhythmUIConfig" :key="config.key" class="my-3">
          <!-- Group type (for 2-column layout) -->
          <template v-if="config.type === 'group' && config.layout === 'columns'">
            <v-row align="center">
              <v-col 
                v-for="item in config.items" 
                :key="item.key" 
                :cols="typeof item.col === 'number' ? item.col : 6"
              >
                <!-- Switch type -->
                <v-switch
                  v-if="item.type === 'switch'"
                  :model-value="rhythmValues[item.key]"
                  @update:model-value="(value) => updateRhythmParam(item.key, value)"
                  :label="item.label"
                  hide-details
                  :color="instrumentConfig.color"
                />
                
                <!-- Slider type -->
                <v-slider
                  v-else-if="item.type === 'slider'"
                  :model-value="rhythmValues[item.key]"
                  @update:model-value="(value) => updateRhythmParam(item.key, value)"
                  :min="item.min"
                  :max="item.max"
                  :step="item.step"
                  thumb-label="always"
                  hide-details
                  :disabled="item.dependsOn && !rhythmValues[item.dependsOn]"
                >
                  <template v-slot:label>
                    <div class="d-flex align-center">
                      {{ item.label }}
                      <v-tooltip 
                        v-if="item.hasTooltip" 
                        bottom
                        max-width="300"
                      >
                        <template v-slot:activator="{ props }">
                          <v-icon 
                            v-bind="props" 
                            icon="mdi-help-circle-outline" 
                            size="16" 
                            class="ml-1 text-grey-600"
                          />
                        </template>
                        <div class="text-caption">
                          <div 
                            v-for="tooltipItem in item.tooltip" 
                            :key="tooltipItem.range"
                          >
                            <strong>{{ tooltipItem.range }}:</strong> {{ tooltipItem.description }}
                          </div>
                        </div>
                      </v-tooltip>
                    </div>
                  </template>
                  <template v-if="item.unit === 'percent'" v-slot:thumb-label="{ modelValue }">
                    {{ modelValue }}%
                  </template>
                </v-slider>
              </v-col>
            </v-row>
          </template>
          
          <!-- Regular single controls -->
          <template v-else>
            <!-- Switch type -->
            <v-switch
              v-if="config.type === 'switch'"
              :model-value="rhythmValues[config.key]"
              @update:model-value="(value) => updateRhythmParam(config.key, value)"
              :label="config.label"
              hide-details
              :color="instrumentConfig.color"
            />
            
            <!-- Slider type -->
            <v-slider
              v-else-if="config.type === 'slider'"
              :model-value="rhythmValues[config.key]"
              @update:model-value="(value) => updateRhythmParam(config.key, value)"
              :min="config.min"
              :max="config.max"
              :step="config.step"
              thumb-label="always"
              hide-details
            >
              <template v-slot:label>
                <div class="d-flex align-center">
                  {{ config.label }}
                  <v-tooltip 
                    v-if="config.hasTooltip" 
                    bottom
                    max-width="300"
                  >
                    <template v-slot:activator="{ props }">
                      <v-icon 
                        v-bind="props" 
                        icon="mdi-help-circle-outline" 
                        size="16" 
                        class="ml-1 text-grey-600"
                      />
                    </template>
                    <div class="text-caption">
                      <div 
                        v-for="item in config.tooltip" 
                        :key="item.range"
                      >
                        <strong>{{ item.range }}:</strong> {{ item.description }}
                      </div>
                    </div>
                  </v-tooltip>
                </div>
              </template>
              <template v-if="config.unit === 'percent'" v-slot:thumb-label="{ modelValue }">
                {{ modelValue }}%
              </template>
              <template v-else-if="config.unit === 'level'" v-slot:thumb-label="{ modelValue }">
                Level {{ modelValue }}
              </template>
            </v-slider>
          </template>
        </div>
      </div>
      <!-- Harmonics -->
      <div v-if="instrumentSettings.harmonics" class="my-4">
        <v-divider class="mb-3"></v-divider>
        <div class="text-subtitle-2 mb-3 font-weight-bold" :style="{ color: instrumentConfig.color }">
          Harmonics Settings
        </div>
        
        <div v-for="config in harmonicsUIConfig" :key="config.key" class="my-3">
          <!-- Slider type -->
          <v-slider
            v-if="config.type === 'slider'"
            :model-value="harmonicsValues[config.key]"
            @update:model-value="(value) => updateHarmonicsParam(config.key, value)"
            :min="config.min"
            :max="config.max"
            :step="config.step"
            thumb-label="always"
            hide-details
          >
            <template v-slot:label>
              <div class="d-flex align-center">
                {{ config.label }}
                <v-tooltip 
                  v-if="config.hasTooltip" 
                  bottom
                  max-width="300"
                >
                  <template v-slot:activator="{ props }">
                    <v-icon 
                      v-bind="props" 
                      icon="mdi-help-circle-outline" 
                      size="16" 
                      class="ml-1 text-grey-600"
                    />
                  </template>
                  <div class="text-caption">
                    <div 
                      v-for="item in config.tooltip" 
                      :key="item.range"
                    >
                      <strong>{{ item.range }}:</strong> {{ item.description }}
                    </div>
                  </div>
                </v-tooltip>
              </div>
            </template>
            <template v-if="config.unit === 'percent'" v-slot:thumb-label="{ modelValue }">
              {{ modelValue }}%
            </template>
          </v-slider>
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
import { RangePitch } from '../composables/pitch/RangePitch.js'
import { RhythmBase } from '../composables/rhythm/RhythmBase.js'

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

const emit = defineEmits(['delete', 'update:params', 'play-note', 'fetch-notes', 'stop-synth2'])
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

// ==================== VOLUME SETTINGS ====================
// Get UI configuration for Volume class
const volumeUIConfig = computed(() => {
  return instrumentSettings.value.volume ? instrumentSettings.value.volume.getUIConfig() : []
})

// Reactive values for Volume UI (intensity, variation, etc.)
const volumeValues = ref({})

// Update Volume parameters from UI interactions
function updateVolumeParam(key, value) {
  if (instrumentSettings.value.volume) {
    // Update reactive values for UI
    volumeValues.value[key] = value
    
    // Update VolumeBase class instance
    instrumentSettings.value.volume.updateParam(key, value)
    
    // TODO: Remove this after the all params are fully integrated
    // Sync with existing params for backward compatibility
    if (key === 'intensity') params.value.velocity = value
    if (key === 'variation') params.value.velocityVariation = value
  }
}
// ======================= END VOLUME =======================

// ======================= TEMPO SETTINGS =======================
// Get UI configuration for Tempo class
const tempoUIConfig = computed(() => {
  return instrumentSettings.value.tempo ? instrumentSettings.value.tempo.getUIConfig() : []
})

// Reactive values for Tempo UI (bpm, variation, etc.)
const tempoValues = ref({})

// Update Tempo parameters from UI interactions
function updateTempoParam(key, value) {
  if (instrumentSettings.value.tempo) {
    // Update reactive values for UI
    tempoValues.value[key] = value
    
    // Update TempoBase class instance
    instrumentSettings.value.tempo.updateParam(key, value)
    
    // TODO: Remove this after the all params are fully integrated
    // Sync with existing params for backward compatibility
    if (key === 'bpm') params.value.tempo = value
  }
}
// ======================= END TEMPO =======================

// ======================= PITCH SETTINGS =======================
// Get UI configuration for Pitch class
const pitchUIConfig = ref([])

// Function to refresh UI config (needed for dynamic constraints)
function refreshPitchUIConfig() {
  if (instrumentSettings.value.pitch) {
    pitchUIConfig.value = instrumentSettings.value.pitch.getUIConfig()
  } else {
    pitchUIConfig.value = []
  }
}

// Reactive values for Pitch UI (frequency, harmonicIntensity, etc.)
const pitchValues = ref({})

// Update Pitch parameters from UI interactions
function updatePitchParam(key, value) {
  if (instrumentSettings.value.pitch) {
    // Update reactive values for UI
    pitchValues.value[key] = value
    
    // Update PitchBase class instance
    instrumentSettings.value.pitch.updateParam(key, value)
    
    // Refresh UI config to update dynamic constraints
    refreshPitchUIConfig()
    
    // TODO: Remove this after the all params are fully integrated
    // Sync with existing params for backward compatibility
    if (key === 'frequency') params.value.frequency = value
    if (key === 'rangeLower') params.value.rangeLower = value
    if (key === 'rangeUpper') params.value.rangeUpper = value
  }
}
// ======================= END PITCH =======================

// ======================= HARMONICS SETTINGS =======================
// Get UI configuration for Harmonics class
const harmonicsUIConfig = computed(() => {
  return instrumentSettings.value.harmonics ? instrumentSettings.value.harmonics.getUIConfig() : []
})

// Reactive values for Harmonics UI (intensity, spread, etc.)
const harmonicsValues = ref({})

// Update Harmonics parameters from UI interactions
function updateHarmonicsParam(key, value) {
  if (instrumentSettings.value.harmonics) {
    // Update reactive values for UI
    harmonicsValues.value[key] = value
    
    // Update HarmonicsBase class instance
    instrumentSettings.value.harmonics.updateParam(key, value)
    
    // TODO: Remove this after the all params are fully integrated
    // Sync with existing params for backward compatibility
    if (key === 'intensity') params.value.harmonicIntensity = value
    if (key === 'spread') params.value.harmonicSpread = value
  }
}
// ======================= END HARMONICS =======================

// ======================= RHYTHM SETTINGS =======================
// Get UI configuration for Rhythm class
const rhythmUIConfig = computed(() => {
  return instrumentSettings.value.rhythm ? instrumentSettings.value.rhythm.getUIConfig() : []
})

// Reactive values for Rhythm UI (restEnabled, restProbability, etc.)
const rhythmValues = ref({})

// Update Rhythm parameters from UI interactions
function updateRhythmParam(key, value) {
  if (instrumentSettings.value.rhythm) {
    // Update reactive values for UI
    rhythmValues.value[key] = value
    
    // Update RhythmBase class instance
    instrumentSettings.value.rhythm.updateParam(key, value)
    
    // TODO: Remove this after the all params are fully integrated
    // Sync with existing params for backward compatibility
    if (key === 'restEnabled') params.value.rest = value
    if (key === 'restProbability') params.value.restProbability = value
    if (key === 'complexity') params.value.duration = value
    if (key === 'noteDensity') params.value.chordProbability = value
  }
}
// ======================= END RHYTHM =======================

// Initialize class-based values when instrument changes
watch(() => params.value.instrument, (newInstrument) => {
  const settings = getInstrumentSettings(newInstrument)
  
  // Update UI configs for new instrument
  refreshPitchUIConfig()
  
  // Initialize Volume values
  if (settings.volume) {
    const volumeInitialValues = settings.volume.getInitialValues()
    volumeValues.value = { ...volumeInitialValues }
    
    // TODO: Remove this after the all params are fully integrated
    // Sync with existing params for backward compatibility
    params.value.velocity = volumeInitialValues.intensity
    params.value.velocityVariation = volumeInitialValues.variation
  }
  
  // Initialize Tempo values
  if (settings.tempo) {
    const tempoInitialValues = settings.tempo.getInitialValues()
    tempoValues.value = { ...tempoInitialValues }
    
    // TODO: Remove this after the all params are fully integrated
    // Sync with existing params for backward compatibility
    params.value.tempo = tempoInitialValues.bpm
  }
  
  // Initialize Pitch values
  if (settings.pitch) {
    const pitchInitialValues = settings.pitch.getInitialValues()
    pitchValues.value = { ...pitchInitialValues }
    
    // Refresh UI config for dynamic constraints
    refreshPitchUIConfig()
    
    // TODO: Remove this after the all params are fully integrated
    // Sync with existing params for backward compatibility
    if (pitchInitialValues.frequency) params.value.frequency = pitchInitialValues.frequency
    if (pitchInitialValues.rangeLower) params.value.rangeLower = pitchInitialValues.rangeLower
    if (pitchInitialValues.rangeUpper) params.value.rangeUpper = pitchInitialValues.rangeUpper
  }
  
  // Initialize Harmonics values
  if (settings.harmonics) {
    const harmonicsInitialValues = settings.harmonics.getInitialValues()
    harmonicsValues.value = { ...harmonicsInitialValues }
    
    // TODO: Remove this after the all params are fully integrated
    // Sync with existing params for backward compatibility
    params.value.harmonicIntensity = harmonicsInitialValues.intensity
    params.value.harmonicSpread = harmonicsInitialValues.spread
  }
  
  // Initialize Rhythm values
  if (settings.rhythm) {
    const rhythmInitialValues = settings.rhythm.getInitialValues()
    rhythmValues.value = { ...rhythmInitialValues }
    
    // TODO: Remove this after the all params are fully integrated
    // Sync with existing params for backward compatibility
    params.value.rest = rhythmInitialValues.restEnabled
    params.value.restProbability = rhythmInitialValues.restProbability
    params.value.duration = rhythmInitialValues.complexity
    params.value.chordProbability = rhythmInitialValues.noteDensity
  }
}, { immediate: true })

// Handle instrument change
watch(() => params.value.instrument, (newInstrument, oldInstrument) => {
  if (newInstrument !== oldInstrument) {
    // synth2 is continuous tone, so stop it when instrument changes
    if (oldInstrument === 'synth2') {
      emit('stop-synth2', props.voiceId)
    }
    
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
  if (params.value.instrument === 'synth2') {
    emit('stop-synth2', props.voiceId)
  }
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
        instrument: params.value.instrument,
        params: params.value,
        globalSettings: props.globalSettings
      })
    })
  }

  // Calculate the time to play the next note
  const duration = RhythmBase.getDurationInMilliseconds(noteData.duration, params.value.tempo * props.globalSettings.tempoFactor)
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

// Generate note options using RangePitch class
const noteOptions = RangePitch.generateNoteOptions(21, 108) // A0 to C8

defineExpose({
  startPlaying,
  stopPlaying
})
</script> 