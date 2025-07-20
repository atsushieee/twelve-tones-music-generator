export class RhythmBase {
  constructor(options = {}) {
    // Rest settings
    this.restEnabled = options.restEnabled ?? true
    this.restProbability = options.restProbability ?? 20    // 0-100%
    
    // Complexity settings  
    this.complexity = options.complexity ?? 50              // 0-100
    
    // Note density settings
    this.noteDensity = options.noteDensity ?? options.chordProbability ?? 30  // 0-100%
    
    // min and max values for each parameter
    this.minComplexity = 0
    this.maxComplexity = 100
    this.minRestProbability = 0
    this.maxRestProbability = 50
    this.minNoteDensity = 0
    this.maxNoteDensity = 100
  }

  getUIConfig() {
    return [
      {
        key: 'complexity',
        type: 'slider', 
        label: 'Complexity',
        min: this.minComplexity,
        max: this.maxComplexity,
        step: 5,
        unit: 'percent',
        hasTooltip: true,
        tooltip: [
          { range: '0%', description: 'half note only' },
          { range: '1-25%', description: 'half or quarter note' },
          { range: '26-50%', description: 'half, quarter or eighth note' },
          { range: '51-75%', description: 'half, quarter, eighth or sixteenth note' },
          { range: '76-100%', description: 'all note values including thirty-second' }
        ]
      },
      {
        key: 'restSettings',
        type: 'group',
        layout: 'columns',
        items: [
          {
            key: 'restEnabled',
            type: 'switch',
            label: 'Rests',
            col: 4  // 4/12 = 33%
          },
          {
            key: 'restProbability', 
            type: 'slider',
            label: 'Probability',
            min: this.minRestProbability,
            max: this.maxRestProbability,
            step: 5,
            unit: 'percent',
            col: 8,  // 8/12 = 67%
            dependsOn: 'restEnabled'
          }
        ]
      },
      {
        key: 'noteDensity',
        type: 'slider',
        label: 'Note Density', 
        min: this.minNoteDensity,
        max: this.maxNoteDensity,
        step: 5,
        unit: 'percent',
        hasTooltip: true,
        tooltip: [
          { range: '0%', description: 'Single notes only' },
          { range: '1-25%', description: 'Mostly single, occasional dual notes' },
          { range: '26-50%', description: 'Mix of single and dual notes' },
          { range: '51-75%', description: 'Frequent dual notes, some triple notes' },
          { range: '76-100%', description: 'Dense harmonies with 2-3 simultaneous notes' }
        ]
      }
    ]
  }

  getInitialValues() {
    return {
      restEnabled: this.restEnabled,
      restProbability: this.restProbability,
      complexity: this.complexity,
      noteDensity: this.noteDensity
    }
  }

  updateParam(key, value) {
    if (key === 'restEnabled') {
      this.restEnabled = Boolean(value)
    }
    if (key === 'restProbability') {
      this.restProbability = Math.max(this.minRestProbability, Math.min(this.maxRestProbability, value))
    }
    if (key === 'complexity') {
      this.complexity = Math.max(this.minComplexity, Math.min(this.maxComplexity, value))
    }
    if (key === 'noteDensity') {
      this.noteDensity = Math.max(this.minNoteDensity, Math.min(this.maxNoteDensity, value))
    }
  }

  getRhythmParams() {
    return {
      restEnabled: this.restEnabled,
      restProbability: this.restProbability,
      complexity: this.complexity,
      noteDensity: this.noteDensity,
      // Backward compatibility
      chordProbability: this.noteDensity
    }
  }
} 