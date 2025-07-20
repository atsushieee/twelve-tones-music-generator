import * as Tone from 'tone'

// Control class for harmonics in realtime
export class HarmonicsBase {
  constructor(intensity = 40, spread = 3, options = {}) {
    this.intensity = intensity    // 0-100%
    this.spread = spread         // 1-5 overtones
    
    this.minIntensity = options.minIntensity ?? 0
    this.maxIntensity = options.maxIntensity ?? 100
    this.minSpread = options.minSpread ?? 1
    this.maxSpread = options.maxSpread ?? 5
  }

  getUIConfig() {
    return [
      {
        key: 'intensity',
        type: 'slider',
        label: 'Harmonic Intensity',
        min: this.minIntensity,
        max: this.maxIntensity,
        step: 1,
        unit: 'percent',
        hasTooltip: true,
        tooltip: [
          { range: '0-25%', description: 'Very subtle harmonics, almost pure tone' },
          { range: '26-50%', description: 'Gentle harmonics, warm sound' },
          { range: '51-75%', description: 'Moderate harmonics, rich timbre' },
          { range: '76-100%', description: 'Strong harmonics, complex overtones' }
        ]
      },
      {
        key: 'spread',
        type: 'slider',
        label: 'Harmonic Spread',
        min: this.minSpread,
        max: this.maxSpread,
        step: 1,
        unit: 'count',
        hasTooltip: true,
        tooltip: [
          { range: '1', description: 'Base frequency only' },
          { range: '2', description: 'Base + 2nd harmonic (octave)' },
          { range: '3', description: 'Base + 2nd & 3rd harmonics (octave + fifth)' },
          { range: '4', description: 'Base + 2nd-4th harmonics (more complex)' },
          { range: '5', description: 'Base + 2nd-5th harmonics (full complexity)' }
        ]
      }
    ]
  }

  getInitialValues() {
    return {
      intensity: this.intensity,
      spread: this.spread
    }
  }

  updateParam(key, value) {
    if (key === 'intensity') {
      this.intensity = Math.max(this.minIntensity, Math.min(this.maxIntensity, value))
    }
    if (key === 'spread') {
      this.spread = Math.max(this.minSpread, Math.min(this.maxSpread, value))
    }
  }

  getHarmonicParams() {
    return {
      harmonicIntensity: this.intensity,
      harmonicSpread: this.spread
    }
  }

  updateIntensity(synthObject, newIntensity) {
    if (synthObject && synthObject.isPlaying) {
      try {
        const now = Tone.now()
        const transitionTime = 0.1
        
        synthObject.harmonicOscillators.forEach((harmOsc, index) => {
          if (harmOsc && harmOsc.volume) {
            const harmonicNumber = index + 2
            const newVolume = Tone.gainToDb((newIntensity / 100) * 0.3 / harmonicNumber)
            harmOsc.volume.linearRampToValueAtTime(newVolume, now + transitionTime)
          }
        })
        
        synthObject.harmonicIntensity = newIntensity
      } catch (error) {
        console.error('Failed to update harmonic intensity:', error)
      }
    }
  }

  updateSpread(synthObject, newSpread, oldSpread) {
    if (synthObject && synthObject.isPlaying) {
      try {
        if (newSpread > oldSpread) {
          this.addHarmonics(synthObject, newSpread - oldSpread)
        } else if (newSpread < oldSpread) {
          this.removeHarmonics(synthObject, oldSpread - newSpread)
        }
        
        synthObject.harmonicSpread = newSpread
      } catch (error) {
        console.error('Failed to update harmonic spread:', error)
      }
    }
  }

  addHarmonics(synthObject, count) {
    if (synthObject && synthObject.isPlaying) {
      const currentCount = synthObject.harmonicOscillators.length
      
      for (let i = 0; i < count; i++) {
        const harmonicNumber = currentCount + i + 2
        const harmonicFreq = synthObject.frequency * harmonicNumber
        
        if (harmonicFreq <= 20000) {
          const harmOsc = new Tone.Oscillator({
            type: 'sine',
            frequency: harmonicFreq,
            volume: Tone.gainToDb((synthObject.harmonicIntensity / 100) * 0.3 / harmonicNumber)
          }).connect(synthObject.envelope)
          
          harmOsc.start()
          synthObject.harmonicOscillators.push(harmOsc)
        }
      }
      
      console.log(`Added ${count} harmonics (total: ${synthObject.harmonicOscillators.length})`)
    }
  }

  removeHarmonics(synthObject, count) {
    if (synthObject && synthObject.isPlaying) {
      for (let i = 0; i < count && synthObject.harmonicOscillators.length > 0; i++) {
        const harmOsc = synthObject.harmonicOscillators.pop()
        try {
          if (harmOsc.state === 'started') {
            harmOsc.stop()
          }
          harmOsc.dispose()
        } catch (error) {
          console.warn('Harmonic removal warning:', error)
        }
      }
      
      console.log(`Removed ${count} harmonics (remaining: ${synthObject.harmonicOscillators.length})`)
    }
  }

  updateAllParams(synthObject, params) {
    const newIntensity = params.harmonicIntensity || this.intensity
    const newSpread = params.harmonicSpread || this.spread
    
    if (this.intensity !== newIntensity) {
      this.updateIntensity(synthObject, newIntensity)
      this.intensity = newIntensity
    }
    
    if (this.spread !== newSpread) {
      this.updateSpread(synthObject, newSpread, this.spread)
      this.spread = newSpread
    }
  }
}
