/**
 * シンプルなTempo制御クラス
 * bpm（基本テンポ）とvariation（テンポの変動率）を管理
 */
export class TempoBase {
  constructor(bpm = 240, variation = 0, minBpm = 60, maxBpm = 480) {
    this.bpm = bpm
    this.variation = variation  // 0-100 (%)
    this.minBpm = minBpm
    this.maxBpm = maxBpm
  }

  // UI設定情報のみを返す（値は含まない）
  getUIConfig() {
    return [
      {
        key: 'bpm',
        type: 'slider',
        label: 'BPM',
        min: this.minBpm,
        max: this.maxBpm,
        step: 10,
        unit: 'bpm'
      },
      {
        key: 'variation',
        type: 'slider',
        label: 'Tempo Variation',
        min: 0,
        max: 50, // テンポ変動は50%までに制限
        step: 5,
        unit: 'percent'
      }
    ]
  }

  // 初期値を取得
  getInitialValues() {
    return {
      bpm: this.bpm,
      variation: this.variation
    }
  }

  // 値を更新
  updateParam(key, value) {
    if (key === 'bpm') {
      this.bpm = Math.max(this.minBpm, Math.min(this.maxBpm, value))
    }
    if (key === 'variation') {
      this.variation = Math.max(0, Math.min(50, value))
    }
  }

  // ランダムな変動を加えたテンポを計算
  getCalculatedTempo(globalTempoFactor = 1.0) {
    const variationRange = this.variation / 100
    const randomVariation = (Math.random() - 0.5) * variationRange
    const finalBpm = this.bpm * (1 + randomVariation)
    return Math.max(this.minBpm, Math.min(this.maxBpm, finalBpm)) * globalTempoFactor
  }
} 