import { ref } from 'vue'
import * as Tone from 'tone'

export function useTonePlayer() {
  const isReady = ref(false)

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

  // wait for load sampler
  const waitForLoad = async () => {
    if (isReady.value) return

    console.log('Waiting for piano samples to load...')
    await new Promise((resolve) => {
      const checkLoaded = setInterval(() => {
        if (sampler.loaded) {
          clearInterval(checkLoaded)
          isReady.value = true
          resolve()
        }
      }, 100)
    })
    console.log('Piano samples ready')
  }

  const playNote = ({ noteName, duration, velocity, time }) => {
    if (!isReady.value) {
      console.warn('Tone player not ready')
      return
    }
    sampler.triggerAttackRelease(
      noteName,
      duration,
      time,
      velocity
    )
  }

  const startAudioContext = async () => {
    await Tone.start()
  }

  return {
    isReady,
    waitForLoad,
    playNote,
    startAudioContext
  }
} 