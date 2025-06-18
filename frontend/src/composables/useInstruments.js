import { ref, computed } from 'vue'

// 楽器設定の定義
const INSTRUMENT_CONFIG = {
  piano: {
    id: 'piano',
    title: 'Piano',
    displayName: 'Piano',
    icon: 'mdi-piano',
    color: '#2196F3', // ブルー
    bgColor: '#E3F2FD',
    category: 'keyboard',
    description: 'Acoustic Grand Piano'
  },
  violin: {
    id: 'violin',
    title: 'Strings',
    displayName: 'Violin',
    icon: 'mdi-violin',
    color: '#FF9800', // オレンジ
    bgColor: '#FFF3E0',
    category: 'strings',
    description: 'Violin Strings'
  },
  // 将来追加予定の楽器
  drum: {
    id: 'drum',
    title: 'Drums',
    displayName: 'Drum Kit',
    icon: 'mdi-drum',
    color: '#F44336', // レッド
    bgColor: '#FFEBEE',
    category: 'percussion',
    description: 'Acoustic Drum Kit'
  },
  synth: {
    id: 'synth',
    title: 'Synth',
    displayName: 'Synthesizer',
    icon: 'mdi-sine-wave',
    color: '#9C27B0', // パープル
    bgColor: '#F3E5F5',
    category: 'electronic',
    description: 'Electronic Synthesizer'
  },
  bass: {
    id: 'bass',
    title: 'Bass',
    displayName: 'Electric Bass',
    icon: 'mdi-guitar-electric',
    color: '#4CAF50', // グリーン
    bgColor: '#E8F5E8',
    category: 'bass',
    description: 'Electric Bass Guitar'
  },
  guitar: {
    id: 'guitar',
    title: 'Guitar',
    displayName: 'Acoustic Guitar',
    icon: 'mdi-guitar-acoustic',
    color: '#795548', // ブラウン
    bgColor: '#EFEBE9',
    category: 'strings',
    description: 'Acoustic Guitar'
  },
  flute: {
    id: 'flute',
    title: 'Flute',
    displayName: 'Flute',
    icon: 'mdi-flute',
    color: '#00BCD4', // シアン
    bgColor: '#E0F2F1',
    category: 'woodwind',
    description: 'Concert Flute'
  },
  trumpet: {
    id: 'trumpet',
    title: 'Trumpet',
    displayName: 'Trumpet',
    icon: 'mdi-trumpet',
    color: '#FFC107', // アンバー
    bgColor: '#FFFDE7',
    category: 'brass',
    description: 'Bb Trumpet'
  }
}

// 現在利用可能な楽器（サンプルが用意されているもの）
const AVAILABLE_INSTRUMENTS = ['piano', 'violin']

export function useInstruments() {
  // 利用可能な楽器のリストを取得
  const getAvailableInstruments = () => {
    return AVAILABLE_INSTRUMENTS.map(id => ({
      title: INSTRUMENT_CONFIG[id].title,
      value: id
    }))
  }

  // 楽器の詳細情報を取得
  const getInstrumentInfo = (instrumentId) => {
    return INSTRUMENT_CONFIG[instrumentId] || INSTRUMENT_CONFIG.piano
  }

  // 楽器の設定情報を取得
  const getInstrumentConfig = (instrumentId) => {
    const config = INSTRUMENT_CONFIG[instrumentId]
    if (!config) return INSTRUMENT_CONFIG.piano
    
    return {
      ...config,
      isAvailable: AVAILABLE_INSTRUMENTS.includes(instrumentId)
    }
  }

  return {
    getAvailableInstruments,
    getInstrumentInfo,
    getInstrumentConfig
  }
}
