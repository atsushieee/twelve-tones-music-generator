// Base class for pitch control
export class PitchBase {
  constructor(instrumentId = 'default') {
    this.instrumentId = instrumentId
  }

  getUIConfig() {
    return []
  }

  getInitialValues() {
    return {}
  }

  updateParam(key, value) {
    // do nothing
  }

  getPitchType() {
    return 'unknown'
  }
} 