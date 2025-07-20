import { PitchBase } from './PitchBase.js'

// Control class for pitch range in realtime
export class RangePitch extends PitchBase {
  constructor(rangeLower = 60, rangeUpper = 76, options = {}) {
    super()
    
    this.rangeLower = rangeLower    // MIDI note number
    this.rangeUpper = rangeUpper    // MIDI note number
    
    // Standard piano range: A0 (21) to C8 (108)
    this.minNote = options.minNote ?? 21   // A0
    this.maxNote = options.maxNote ?? 108  // C8
  }

  getUIConfig() {
    return [
      {
        key: 'rangeSettings',
        type: 'group',
        layout: 'columns',
        items: [
          {
            key: 'rangeLower',
            type: 'select',
            label: 'Lower',
            options: this.getNoteOptionsForLower(),
            col: 6
          },
          {
            key: 'rangeUpper',
            type: 'select',
            label: 'Upper', 
            options: this.getNoteOptionsForUpper(),
            col: 6
          }
        ]
      }
    ]
  }

  getInitialValues() {
    return {
      rangeLower: this.rangeLower,
      rangeUpper: this.rangeUpper
    }
  }

  updateParam(key, value) {
    if (key === 'rangeLower') {
      this.rangeLower = Math.max(this.minNote, Math.min(this.maxNote, value))
      // Ensure lower doesn't exceed upper
      if (this.rangeLower > this.rangeUpper) {
        this.rangeUpper = this.rangeLower
      }
    }
    if (key === 'rangeUpper') {
      this.rangeUpper = Math.max(this.minNote, Math.min(this.maxNote, value))
      // Ensure upper doesn't go below lower
      if (this.rangeUpper < this.rangeLower) {
        this.rangeLower = this.rangeUpper
      }
    }
  }

  getPitchType() {
    return 'range'
  }

  getPitchParams() {
    return {
      rangeLower: this.rangeLower,
      rangeUpper: this.rangeUpper,
      pitchType: this.getPitchType()
    }
  }

  // Generate note options for dropdown
  getNoteOptions() {
    const options = []
    for (let midi = this.minNote; midi <= this.maxNote; midi++) {
      options.push({
        title: this.midiToNoteName(midi),
        value: midi
      })
    }
    return options
  }

  // Generate note options for lower range (constrained by upper range)
  getNoteOptionsForLower() {
    const options = []
    const maxAllowed = this.rangeUpper // Lower cannot exceed upper
    for (let midi = this.minNote; midi <= Math.min(this.maxNote, maxAllowed); midi++) {
      options.push({
        title: this.midiToNoteName(midi),
        value: midi
      })
    }
    return options
  }

  // Generate note options for upper range (constrained by lower range)
  getNoteOptionsForUpper() {
    const options = []
    const minAllowed = this.rangeLower // Upper cannot be below lower
    for (let midi = Math.max(this.minNote, minAllowed); midi <= this.maxNote; midi++) {
      options.push({
        title: this.midiToNoteName(midi),
        value: midi
      })
    }
    return options
  }

  // Convert MIDI note number to note name
  midiToNoteName(midi) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const note = noteNames[midi % 12]
    const octave = Math.floor(midi / 12) - 1
    return `${note}${octave}`
  }

  // Static method for generating note options (for external use)
  static generateNoteOptions(minNote = 21, maxNote = 108) {
    const options = []
    for (let midi = minNote; midi <= maxNote; midi++) {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
      const note = noteNames[midi % 12]
      const octave = Math.floor(midi / 12) - 1
      options.push({
        title: `${note}${octave}`,
        value: midi
      })
    }
    return options
  }

  // Static method for MIDI to note name conversion (for external use)
  static midiToNoteName(midi) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const note = noteNames[midi % 12]
    const octave = Math.floor(midi / 12) - 1
    return `${note}${octave}`
  }
} 