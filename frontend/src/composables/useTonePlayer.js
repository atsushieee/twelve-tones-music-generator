import { ref } from 'vue'
import * as Tone from 'tone'

export function useTonePlayer() {
  const isReady = ref(false)
  const currentInstrument = ref('piano') // デフォルトはピアノ

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

  const playNote = ({ noteName, duration, velocity, time }) => {
    if (!isReady.value) {
      console.warn('Tone player not ready')
      return
    }
    
    if (currentInstrument.value === 'violin') {
      violinSampler.triggerAttackRelease(
        noteName,
        duration,
        time,
        velocity
      )
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
  
  const setInstrument = (instrument) => {
    currentInstrument.value = instrument
    console.log(`Instrument changed to ${instrument}`)
  }

  return {
    isReady,
    waitForLoad,
    playNote,
    startAudioContext,
    setInstrument,
    currentInstrument
  }
} 