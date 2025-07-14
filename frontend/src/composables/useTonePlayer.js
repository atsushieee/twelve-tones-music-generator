import { ref } from 'vue'
import * as Tone from 'tone'

export function useTonePlayer() {
  const isReady = ref(false)
  const currentInstrument = ref('piano') // デフォルトはピアノ
  
  // To manage independent all synths
  const voiceSynths = new Map()
  
  // To manage continuous synth2 oscillators
  const voiceSynth2s = new Map()

  const sampler = new Tone.Sampler({
    urls: generateUrls(),
    baseUrl: "/",
    onload: () => {
      console.log('Piano samples loaded successfully')
      isReady.value = true
    }
  }).toDestination()

  function generateUrls() {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const flatNotes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
    const urls = {}
    for (let octave = 0; octave <= 7; octave++) {
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i]
        const flatNote = flatNotes[i]
        if (octave === 0 && !['A', 'A#', 'B'].includes(note)) continue
        const noteName = `${note}${octave}`
        urls[noteName] = `acoustic_grand_piano-mp3/${flatNote}${octave}.mp3`
      }
    }
    return urls
  }

  // Violin Sampler
  const violinSampler = new Tone.Sampler({
    urls: {
      'A4': 'violin-mp3/A4.mp3',
      'A5': 'violin-mp3/A5.mp3',
      'C4': 'violin-mp3/C4.mp3',
      'C6': 'violin-mp3/C6.mp3',
      'E4': 'violin-mp3/E4.mp3',
      'E6': 'violin-mp3/E6.mp3',
      'G4': 'violin-mp3/G4.mp3',
      'G6': 'violin-mp3/G6.mp3',
    },
    baseUrl: "/",
    onload: () => {
      console.log('Violin samples loaded successfully')
    }
  }).toDestination()

  // Dependent on voiceId, create a synth for each voice
  const createVoiceSynth = (voiceId) => {    
    const synth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.1,
        decay: 0.3,
        sustain: 0.5,
        release: 1.0
      }
    }).toDestination()
    
    voiceSynths.set(voiceId, synth)
    console.log(`Created independent synth for voice ${voiceId}`)
    return synth
  }

  // Create continuous synth2 for each voice
  const createVoiceSynth2 = (voiceId, frequency = 432, volume = 1.0, params = {}) => {
    // reverb effect with long decay
    // oscillator → envelope → gain → reverb → destination
    const reverb = new Tone.Reverb({
      decay: 12,
      wet: 0.6,
      roomSize: 0.8
    }).toDestination()
    
    const gain = new Tone.Gain(volume).connect(reverb)
    
    // Long attack & release time to match the crystal bowl sound
    const envelope = new Tone.AmplitudeEnvelope({
      attack: 2,
      decay: 0.5,
      sustain: 0.8,
      release: 8
    }).connect(gain)
    
    // Crystal Bowl harmonics settings (from params or defaults)
    const harmonicSpread = params.harmonicSpread || 3
    const harmonicIntensity = params.harmonicIntensity || 40
    
    // Base oscillator
    const baseOscillator = new Tone.Oscillator({
      type: 'sine',
      frequency: frequency
    }).connect(envelope)
    
    // manager for harmonic oscillators
    const harmonicOscillators = []
    
    // create harmonic oscillators
    for (let i = 0; i < harmonicSpread; i++) {
      const harmonicNumber = i + 2 // start from 2nd harmonic
      const harmonicFreq = frequency * harmonicNumber
      
      if (harmonicFreq <= 20000) { // within audible range
        const harmOsc = new Tone.Oscillator({
          type: 'sine',
          frequency: harmonicFreq,
          volume: Tone.gainToDb((harmonicIntensity / 100) * 0.3 / harmonicNumber)
        }).connect(envelope)
        
        harmonicOscillators.push(harmOsc)
      }
    }
    
    const synth2 = {
      baseOscillator,
      harmonicOscillators,
      envelope,
      gain,
      reverb,
      isPlaying: false,
      frequency: frequency,
      harmonicSpread: harmonicSpread,
      harmonicIntensity: harmonicIntensity 
    }
    
    voiceSynth2s.set(voiceId, synth2)
    console.log(`Created continuous synth2 for voice ${voiceId} at ${frequency}Hz with ${harmonicOscillators.length} harmonics`)
    return synth2
  }

  // Start continuous synth2
  const startVoiceSynth2 = (voiceId, frequency = 432, volume = 1.0, params = {}) => {
    let synth2 = voiceSynth2s.get(voiceId)
    if (!synth2) {
      synth2 = createVoiceSynth2(voiceId, frequency, volume, params)
    }
    
    if (!synth2.isPlaying) {
      synth2.baseOscillator.start()
      synth2.harmonicOscillators.forEach(harmOsc => {
        harmOsc.start()
      })
      
      synth2.envelope.triggerAttack()
      synth2.isPlaying = true
    }
  }

  // Stop continuous synth2
  const stopVoiceSynth2 = (voiceId) => {
    const synth2 = voiceSynth2s.get(voiceId)
    if (synth2 && synth2.isPlaying) {
      synth2.envelope.triggerRelease()
      
      // Clean up after release time
      setTimeout(() => {
        try {
          synth2.harmonicOscillators.forEach(harmOsc => {
            try {
              if (harmOsc.state === 'started') {
                harmOsc.stop()
              }
              harmOsc.dispose()
            } catch (error) {
              console.warn('Harmonic oscillator cleanup warning:', error)
            }
          })
          if (synth2.baseOscillator.state === 'started') {
            synth2.baseOscillator.stop()
          }
          synth2.baseOscillator.dispose()
          
          synth2.envelope.dispose()
          synth2.gain.dispose()
          synth2.reverb.dispose()
          voiceSynth2s.delete(voiceId)
          console.log(`Stopped and cleaned up synth2 for voice ${voiceId}`)
        } catch (error) {
          console.warn(`Error cleaning up synth2 for voice ${voiceId}:`, error)
        }
      }, 8000) // release time
      
      synth2.isPlaying = false
    } else {
      // if synth2 is not playing, do nothing. it's not an error.
      console.log(`No active synth2 found for voice ${voiceId}`)
    }
  }

  // Update synth2 frequency
  const updateSynth2Frequency = (voiceId, frequency) => {
    const synth2 = voiceSynth2s.get(voiceId)
    if (synth2 && synth2.isPlaying) {
      const now = Tone.now()
      const transitionTime = 0.5
      
      synth2.baseOscillator.frequency.linearRampToValueAtTime(frequency, now + transitionTime)
      
      // change the frequency of harmonic oscillators proportionally
      synth2.harmonicOscillators.forEach((harmOsc, index) => {
        if (harmOsc && harmOsc.state === 'started') {
          const harmonicNumber = index + 2 // start from 2nd harmonic
          const newHarmonicFreq = frequency * harmonicNumber
          
          if (newHarmonicFreq <= 20000) { // within audible range
            harmOsc.frequency.linearRampToValueAtTime(newHarmonicFreq, now + transitionTime)
          }
        }
      })
      
      synth2.frequency = frequency
    }
  }

  const updateSynth2Volume = (voiceId, volume) => {
    const synth2 = voiceSynth2s.get(voiceId)
    if (synth2 && synth2.gain) {
      const now = Tone.now()
      // if the volume is radical changed to avoid noise generation
      synth2.gain.gain.linearRampToValueAtTime(volume, now + 0.5)
    }
  }

  const updateSynth2Harmonics = (voiceId, params) => {
    const synth2 = voiceSynth2s.get(voiceId)
    if (synth2 && synth2.isPlaying) {
      const newHarmonicSpread = params.harmonicSpread || 3
      const newHarmonicIntensity = params.harmonicIntensity || 40
      
      if (synth2.harmonicIntensity !== newHarmonicIntensity) {
        updateHarmonicIntensity(voiceId, newHarmonicIntensity)
        synth2.harmonicIntensity = newHarmonicIntensity
      }
      
      if (synth2.harmonicSpread !== newHarmonicSpread) {
        updateHarmonicSpread(voiceId, newHarmonicSpread, synth2.harmonicSpread)
        synth2.harmonicSpread = newHarmonicSpread
      }
    }
  }

  const updateHarmonicIntensity = (voiceId, newIntensity) => {
    const synth2 = voiceSynth2s.get(voiceId)
    if (synth2 && synth2.isPlaying) {
      try {
        const now = Tone.now()
        const transitionTime = 0.1
        
        synth2.harmonicOscillators.forEach((harmOsc, index) => {
          if (harmOsc && harmOsc.volume) {
            const harmonicNumber = index + 2
            const newVolume = Tone.gainToDb((newIntensity / 100) * 0.3 / harmonicNumber)
            harmOsc.volume.linearRampToValueAtTime(newVolume, now + transitionTime)
          }
        })
      } catch (error) {
        console.error('Failed to update harmonic intensity:', error)
      }
    }
  }

  const updateHarmonicSpread = (voiceId, newSpread, oldSpread) => {
    const synth2 = voiceSynth2s.get(voiceId)
    if (synth2 && synth2.isPlaying) {
      try {
        if (newSpread > oldSpread) {
          addHarmonics(voiceId, newSpread - oldSpread)
        } else if (newSpread < oldSpread) {
          removeHarmonics(voiceId, oldSpread - newSpread)
        }
      } catch (error) {
        console.error('Failed to update harmonic spread:', error)
      }
    }
  }

  const addHarmonics = (voiceId, count) => {
    const synth2 = voiceSynth2s.get(voiceId)
    if (synth2 && synth2.isPlaying) {
      const currentCount = synth2.harmonicOscillators.length
      
      for (let i = 0; i < count; i++) {
        const harmonicNumber = currentCount + i + 2 // start from 2nd harmonic
        const harmonicFreq = synth2.frequency * harmonicNumber
        
        if (harmonicFreq <= 20000) { // within audible range
          const harmOsc = new Tone.Oscillator({
            type: 'sine',
            frequency: harmonicFreq,
            volume: Tone.gainToDb((synth2.harmonicIntensity / 100) * 0.3 / harmonicNumber)
          }).connect(synth2.envelope)
          
          harmOsc.start()
          synth2.harmonicOscillators.push(harmOsc)
        }
      }
      
      console.log(`Added ${count} harmonics to voice ${voiceId}`)
    }
  }

  const removeHarmonics = (voiceId, count) => {
    const synth2 = voiceSynth2s.get(voiceId)
    if (synth2 && synth2.isPlaying) {
      for (let i = 0; i < count && synth2.harmonicOscillators.length > 0; i++) {
        const harmOsc = synth2.harmonicOscillators.pop()
        try {
          if (harmOsc.state === 'started') {
            harmOsc.stop()
          }
          harmOsc.dispose()
        } catch (error) {
          console.warn('Harmonic removal warning:', error)
        }
      }
      
      console.log(`Removed ${count} harmonics from voice ${voiceId}`)
    }
  }

  // wait for load sampler
  const waitForLoad = async () => {
    if (isReady.value) return

    console.log('Waiting for samples to load...')
    await new Promise((resolve) => {
      const checkLoaded = setInterval(() => {
        if (sampler.loaded && violinSampler.loaded) {
          clearInterval(checkLoaded)
          isReady.value = true
          resolve()
        }
      }, 100)
    })
    console.log('Samples ready')
  }

  // This method is called from each voice (VoiceControl.vue)
  const playNote = ({ noteName, duration, velocity, time, instrument, voiceId, params, globalSettings }) => {
    if (!isReady.value) {
      console.warn('Tone player not ready')
      return
    }
    
    // instrumentパラメータが指定されている場合はそれを使用、なければcurrentInstrumentを使用
    const targetInstrument = instrument || currentInstrument.value
    
    if (targetInstrument === 'violin') {
      violinSampler.triggerAttackRelease(
        noteName,
        duration,
        time,
        velocity
      )
    } else if (targetInstrument === 'synth') {
      if (voiceId) {
        let voiceSynth = voiceSynths.get(voiceId)
        if (!voiceSynth) {
          voiceSynth = createVoiceSynth(voiceId)
        }
        voiceSynth.triggerAttackRelease(
          noteName,
          duration,
          time,
          velocity
        )
      } else {
        console.warn('Synth playNote called without voiceId')
      }
    } else if (targetInstrument === 'synth2') {
      // synth2: control the continuous tone
      if (voiceId && params && globalSettings) {
        const frequency = params.frequency || 432
        const baseVolume = params.velocity * globalSettings.volumeFactor
        const velocityVariation = params.velocityVariation || 0
        
        const variation = (Math.random() - 0.5) * (velocityVariation / 100)
        const finalVolume = Math.max(0.0, Math.min(1.0, baseVolume + variation))
        
        const synth2 = voiceSynth2s.get(voiceId)
        
        if (synth2 && synth2.isPlaying) {
          updateSynth2Frequency(voiceId, frequency)
          updateSynth2Volume(voiceId, finalVolume)
          updateSynth2Harmonics(voiceId, params)
        } else {
          startVoiceSynth2(voiceId, frequency, finalVolume, params)
        }
      } else {
        console.warn('Synth2 playNote called without voiceId, params, or globalSettings')
      }
    } else {
      sampler.triggerAttackRelease(
        noteName,
        duration,
        time,
        velocity
      )
    }
  }

  const startAudioContext = async () => {
    await Tone.start()
  }

  return {
    waitForLoad,
    playNote,
    startAudioContext,
    stopVoiceSynth2,
  }
} 