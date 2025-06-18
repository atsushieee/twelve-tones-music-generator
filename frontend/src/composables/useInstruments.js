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
    settings: {
      showVelocityVariation: true,
      showChordProbability: true,
      showComplexity: true,
      showRange: true,
      showRest: true,
      maxTempo: 480,
      minTempo: 60,
      tempoStep: 10,
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
    settings: {
      showVelocityVariation: true,
      showChordProbability: true,
      showComplexity: true,
      showRange: true,
      showRest: true,
      maxTempo: 400,
      minTempo: 80,
      tempoStep: 10,
      defaultRange: { lower: 55, upper: 93 }, // G3-A6 (typical violin range)
      chordProbabilityMax: 50, // Violin has limited simultaneous notes
      specialSettings: [
        {
          id: 'bowingStyle',
          type: 'select',
          label: 'Bowing Style',
          options: [
            { title: 'Legato', value: 'legato' },
            { title: 'Staccato', value: 'staccato' },
            { title: 'Spiccato', value: 'spiccato' }
          ],
          default: 'legato'
        },
        {
          id: 'vibrato',
          type: 'switch',
          label: 'Vibrato',
          default: false
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
  synth: {
    id: 'synth',
    title: 'Synth',
    displayName: 'Synthesizer',
    icon: 'mdi-sine-wave',
    color: '#9C27B0', // Purple
    bgColor: '#F3E5F5',
    category: 'electronic',
    description: 'Electronic Synthesizer'
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
const AVAILABLE_INSTRUMENTS = ['piano', 'violin']

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
