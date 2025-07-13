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
  const createVoiceSynth2 = (voiceId, frequency = 432, volume = 1.0) => {
    const gain = new Tone.Gain(volume).toDestination()
    const envelope = new Tone.AmplitudeEnvelope({
      attack: 0.5,
      decay: 0.1,
      sustain: 0.8,
      release: 2.0
    }).connect(gain)
    
    const oscillator = new Tone.Oscillator({
      type: 'sine',
      frequency: frequency
    }).connect(envelope)
    
    const synth2 = {
      oscillator,
      envelope,
      gain,
      isPlaying: false,
      frequency: frequency
    }
    
    voiceSynth2s.set(voiceId, synth2)
    console.log(`Created continuous synth2 for voice ${voiceId} at ${frequency}Hz`)
    return synth2
  }

  // Start continuous synth2
  const startVoiceSynth2 = (voiceId, frequency = 432, volume = 1.0) => {
    let synth2 = voiceSynth2s.get(voiceId)
    if (!synth2) {
      synth2 = createVoiceSynth2(voiceId, frequency, volume)
    }
    
    if (!synth2.isPlaying) {
      synth2.oscillator.start()
      synth2.envelope.triggerAttack()
      synth2.isPlaying = true
      console.log(`Started continuous synth2 for voice ${voiceId}`)
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
          if (synth2.oscillator.state === 'started') {
            synth2.oscillator.stop()
          }
          synth2.oscillator.dispose()
          synth2.envelope.dispose()
          synth2.gain.dispose()
          voiceSynth2s.delete(voiceId)
          console.log(`Stopped and cleaned up synth2 for voice ${voiceId}`)
        } catch (error) {
          console.warn(`Error cleaning up synth2 for voice ${voiceId}:`, error)
        }
      }, 2000) // release time
      
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
      // frequency is gradually changed to change the tone smoothly & naturally
      synth2.oscillator.frequency.linearRampToValueAtTime(frequency, now + 0.5)
      synth2.frequency = frequency
      console.log(`Updated synth2 frequency for voice ${voiceId} to ${frequency}Hz`)
    }
  }

  // Update synth2 volume
  const updateSynth2Volume = (voiceId, volume) => {
    const synth2 = voiceSynth2s.get(voiceId)
    if (synth2 && synth2.gain) {
      const now = Tone.now()
      // if the volume is radical changed to avoid noise generation
      synth2.gain.gain.linearRampToValueAtTime(volume, now + 0.5)
      console.log(`Updated synth2 volume for voice ${voiceId} to ${volume}`)
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
        } else {
          startVoiceSynth2(voiceId, frequency, finalVolume)
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