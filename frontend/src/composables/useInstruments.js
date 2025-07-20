import { VolumeBase } from './volume/VolumeBase.js'
import { TempoBase } from './tempo/TempoBase.js'
import { FixedPitch } from './pitch/FixedPitch.js'
import { HarmonicsBase } from './harmonics/HarmonicsBase.js'
import { RhythmBase } from './rhythm/RhythmBase.js'

// Instrument configuration definition
const INSTRUMENT_CONFIG = {
  piano: {
    id: 'piano',
    title: 'Piano',
    displayName: 'Piano',
    icon: 'mdi-piano',
    color: '#2196F3', // Blue
    bgColor: '#E3F2FD',
    category: 'keyboard',
    description: 'Acoustic Grand Piano',
    audioType: 'sample',
    settings: {
      volume: new VolumeBase(1.0, 0),
      tempo: new TempoBase(240, 0, 60, 480),
      rhythm: new RhythmBase({
        complexity: 0,
        restEnabled: true,
        restProbability: 15,
        noteDensity: 0
      }),
      showRange: true,
      defaultRange: { lower: 60, upper: 76 },
      specialSettings: []
    }
  },
  violin: {
    id: 'violin',
    title: 'Strings',
    displayName: 'Violin',
    icon: 'mdi-violin',
    color: '#FF9800', // Orange
    bgColor: '#FFF3E0',
    category: 'strings',
    description: 'Violin Strings',
    audioType: 'sample',
    settings: {
      volume: new VolumeBase(1.0, 0),
      rhythm: new RhythmBase({
        complexity: 0,
        restEnabled: true,
        restProbability: 25,
        noteDensity: 0
      }),
      showRange: true,
      defaultRange: { lower: 55, upper: 93 }, // G3-A6 (typical violin range)
      specialSettings: []
    }
  },
  synth: {
    id: 'synth',
    title: 'Synth',
    displayName: 'Crystal Bowl Synth',
    icon: 'mdi-sine-wave',
    color: '#9C27B0', // Purple
    bgColor: '#F3E5F5',
    category: 'electronic',
    description: 'Tibetan crystal bowl style synthesizer',
    audioType: 'synthesized',
    settings: {
      volume: new VolumeBase(1.0, 0),
      harmonics: new HarmonicsBase(30, 2),
      rhythm: new RhythmBase({
        complexity: 0,
        restEnabled: true,
        restProbability: 20,
        noteDensity: 0
      }),
      showRange: true,
      defaultRange: { lower: 60, upper: 76 },
      specialSettings: []
    }
  },
  synth2: {
    id: 'synth2',
    title: 'Crystal Bowl',
    displayName: 'Crystal Bowl',
    icon: 'mdi-sine-wave',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
    category: 'electronic',
    description: 'Tibetan crystal bowl with harmonics',
    audioType: 'synthesized',
    settings: {
      volume: new VolumeBase(0.3, 30),
      pitch: new FixedPitch(432),
      harmonics: new HarmonicsBase(40, 3),
      showRange: false,
      specialSettings: []
    }
  },
  // Future instruments to be added
  drum: {
    id: 'drum',
    title: 'Drums',
    displayName: 'Drum Kit',
    icon: 'mdi-drum',
    color: '#F44336', // Red
    bgColor: '#FFEBEE',
    category: 'percussion',
    description: 'Acoustic Drum Kit'
  },
  bass: {
    id: 'bass',
    title: 'Bass',
    displayName: 'Electric Bass',
    icon: 'mdi-guitar-electric',
    color: '#4CAF50', // Green
    bgColor: '#E8F5E8',
    category: 'bass',
    description: 'Electric Bass Guitar'
  },
  guitar: {
    id: 'guitar',
    title: 'Guitar',
    displayName: 'Acoustic Guitar',
    icon: 'mdi-guitar-acoustic',
    color: '#795548', // Brown
    bgColor: '#EFEBE9',
    category: 'strings',
    description: 'Acoustic Guitar'
  },
  flute: {
    id: 'flute',
    title: 'Flute',
    displayName: 'Flute',
    icon: 'mdi-flute',
    color: '#00BCD4', // Cyan
    bgColor: '#E0F2F1',
    category: 'woodwind',
    description: 'Concert Flute'
  },
  trumpet: {
    id: 'trumpet',
    title: 'Trumpet',
    displayName: 'Trumpet',
    icon: 'mdi-trumpet',
    color: '#FFC107', // Amber
    bgColor: '#FFFDE7',
    category: 'brass',
    description: 'Bb Trumpet'
  }
}

// Currently available instruments (with samples prepared)
const AVAILABLE_INSTRUMENTS = ['piano', 'violin', 'synth', 'synth2']

export function useInstruments() {
  // Get list of available instruments
  const getAvailableInstruments = () => {
    return AVAILABLE_INSTRUMENTS.map(id => ({
      title: INSTRUMENT_CONFIG[id].title,
      value: id
    }))
  }

  // Get instrument details
  const getInstrumentInfo = (instrumentId) => {
    return INSTRUMENT_CONFIG[instrumentId] || INSTRUMENT_CONFIG.piano
  }

  // Get instrument configuration
  const getInstrumentConfig = (instrumentId) => {
    const config = INSTRUMENT_CONFIG[instrumentId]
    if (!config) return INSTRUMENT_CONFIG.piano
    
    return {
      ...config,
      isAvailable: AVAILABLE_INSTRUMENTS.includes(instrumentId)
    }
  }

  // Get instrument-specific settings
  const getInstrumentSettings = (instrumentId) => {
    const config = INSTRUMENT_CONFIG[instrumentId]
    return config?.settings || INSTRUMENT_CONFIG.piano.settings
  }

  return {
    getAvailableInstruments,
    getInstrumentInfo,
    getInstrumentConfig,
    getInstrumentSettings
  }
}
