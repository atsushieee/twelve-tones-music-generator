export class VolumeBase {
  constructor(intensity = 1.0, variation = 0) {
    this.intensity = intensity
    this.variation = variation
  }

  getUIConfig() {
    return [
      {
        key: 'intensity',
        type: 'slider',
        label: 'Intensity',
        min: 0,
        max: 1,
        step: 0.1
      },
      {
        key: 'variation',
        type: 'slider',
        label: 'Variation',
        min: 0,
        max: 100,
        step: 5,
        unit: 'percent'
      }
    ]
  }

  getInitialValues() {
    return {
      intensity: this.intensity,
      variation: this.variation
    }
  }

  updateParam(key, value) {
    if (key === 'intensity') this.intensity = value
    if (key === 'variation') this.variation = value
  }
}
 