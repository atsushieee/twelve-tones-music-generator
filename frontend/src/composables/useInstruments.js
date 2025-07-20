import { VolumeBase } from './volume/VolumeBase.js'
import { TempoBase } from './tempo/TempoBase.js'

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
      showChordProbability: true,
      showComplexity: true,
      showRange: true,
      showRest: true,
      defaultRange: { lower: 60, upper: 76 },
      chordProbabilityMax: 100,
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
      showChordProbability: true,
      showComplexity: true,
      showRange: true,
      showRest: true,
      defaultRange: { lower: 55, upper: 93 }, // G3-A6 (typical violin range)
      chordProbabilityMax: 50, // Violin has limited simultaneous notes
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
      showChordProbability: true,
      showComplexity: true,
      showRange: true,
      showRest: true,
      defaultRange: { lower: 60, upper: 76 },
      chordProbabilityMax: 100,
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
      showChordProbability: false,
      showComplexity: false,
      showRange: false,
      showRest: false,
      isContinuous: true,
      specialSettings: [
        {
          id: 'frequency',
          type: 'slider',
          label: 'Frequency (Hz)',
          min: 100,
          max: 1000,
          step: 1,
          default: 432,
          description: 'Adjust the pitch of the continuous tone'
        },
        {
          id: 'harmonicIntensity',
          type: 'slider',
          label: 'Harmonic Intensity',
          min: 0,
          max: 100,
          step: 1,
          default: 40,
          description: 'Adjust the strength of harmonic overtones'
        },
        {
          id: 'harmonicSpread',
          type: 'slider',
          label: 'Harmonic Spread',
          min: 1,
          max: 5,
          step: 1,
          default: 3,
          description: 'Number of harmonic overtones'
        }
      ]
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
