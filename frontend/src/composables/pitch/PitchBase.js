// Base class for pitch control
export class PitchBase {
  constructor() {
    // Base class for pitch control
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