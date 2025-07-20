import { PitchBase } from './PitchBase.js'

// Control class for fixed pitch in realtime
export class FixedPitch extends PitchBase {
  constructor(frequency = 432, options = {}) {
    super()
    
    this.frequency = frequency    // 100-1000 Hz
    
    this.minFrequency = options.minFrequency ?? 100
    this.maxFrequency = options.maxFrequency ?? 1000
  }

  getUIConfig() {
    return [
      {
        key: 'frequency',
        type: 'slider',
        label: 'Frequency',
        min: this.minFrequency,
        max: this.maxFrequency,
        step: 1,
        unit: 'hz'
      }
    ]
  }

  getInitialValues() {
    return {
      frequency: this.frequency
    }
  }

  updateParam(key, value) {
    if (key === 'frequency') {
      this.frequency = Math.max(this.minFrequency, Math.min(this.maxFrequency, value))
    }
  }

  getPitchType() {
    return 'fixed'
  }
} 