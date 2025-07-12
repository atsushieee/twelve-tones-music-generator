<template>
  <v-card class="mb-4">
    <v-card-title>Crystal Bowl</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-slider
            v-model="frequency"
            label="Frequency"
            min="100"
            max="1000"
            step="1"
          />
          <div class="text-center">
            {{ frequency }}Hz
          </div>
        </v-col>
        <v-col cols="12" md="6">
          <v-slider
            v-model="volume"
            label="Volume"
            min="0"
            max="100"
            step="1"
          />
          <div class="text-center">
            {{ volume }}%
          </div>
        </v-col>
      </v-row>
      
      <v-row class="mt-4">
        <v-col cols="12">
          <v-divider class="mb-4"></v-divider>
          <h4 class="mb-3">Harmonics (倍音)</h4>
        </v-col>
        <v-col cols="12" md="6">
          <v-slider
            v-model="harmonicIntensity"
            label="Harmonic Intensity"
            min="0"
            max="100"
            step="1"
          />
          <div class="text-center">
            {{ harmonicIntensity }}%
          </div>
        </v-col>
        <v-col cols="12" md="6">
          <v-slider
            v-model="harmonicSpread"
            label="Harmonic Spread"
            min="1"
            max="5"
            step="1"
          />
          <div class="text-center">
            {{ harmonicSpread }} harmonics
          </div>
        </v-col>
      </v-row>
      
      <v-row class="mt-4">
        <v-col class="text-center">
          <v-btn
            :color="isPlaying ? 'error' : 'primary'"
            size="large"
            @click="togglePlay"
            :disabled="isTransitioning"
            :loading="isTransitioning"
          >
            <v-icon :icon="isPlaying ? 'mdi-stop' : 'mdi-music-note'" class="mr-2" />
            {{ isTransitioning ? 'Stopping...' : (isPlaying ? 'Stop' : 'Play Crystal Bowl') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as Tone from 'tone'

// リアクティブな状態
const frequency = ref(432) // A4の周波数  
const volume = ref(30) // ボリューム（0-100%）
const harmonicIntensity = ref(40) // 倍音の強さ（0-100%）
const harmonicSpread = ref(3) // 倍音の数（1-5）
const isPlaying = ref(false)
const audioInitialized = ref(false)
const isTransitioning = ref(false) // 停止処理中フラグ

// シンセサイザーとエフェクト
let oscillator = null
let harmonicOscillators = [] // 倍音用オシレーター配列
let envelope = null
let reverb = null
let gain = null

// 初期化
onMounted(async () => {
  await setupAudio()
})

// 周波数変更の監視
watch(frequency, (newFreq, oldFreq) => {
  if (isPlaying.value && oscillator && oscillator.state === 'started') {
    updateFrequencySmooth(newFreq, oldFreq)
  }
})

// ボリューム変更の監視
watch(volume, (newVol, oldVol) => {
  if (isPlaying.value && gain) {
    updateVolumeSmooth(newVol, oldVol)
  }
})

// 倍音強度変更の監視
watch(harmonicIntensity, (newIntensity) => {
  if (isPlaying.value && harmonicOscillators.length > 0) {
    updateHarmonicIntensity(newIntensity)
  }
})

// 倍音数変更の監視
watch(harmonicSpread, (newSpread, oldSpread) => {
  if (isPlaying.value) {
    updateHarmonicSpread(newSpread, oldSpread)
  }
})

// クリーンアップ
onUnmounted(() => {
  cleanupOscillator()
  cleanupHarmonics()
  if (envelope) envelope.dispose()
  if (reverb) reverb.dispose()
  if (gain) gain.dispose()
})

// オシレーターの安全なクリーンアップ
function cleanupOscillator() {
  if (oscillator) {
    try {
      if (oscillator.state === 'started') {
        oscillator.stop()
      }
      oscillator.dispose()
    } catch (error) {
      console.warn('Oscillator cleanup warning:', error)
    }
    oscillator = null
  }
}
// 倍音オシレーターの安全なクリーンアップ
function cleanupHarmonics() {
  harmonicOscillators.forEach(harmOsc => {
    try {
      if (harmOsc.state === 'started') {
        harmOsc.stop()
      }
      harmOsc.dispose()
    } catch (error) {
      console.warn('Harmonic oscillator cleanup warning:', error)
    }
  })
  harmonicOscillators = []
}

// オーディオ設定
async function setupAudio() {
  try {
    // リバーブエフェクト（長い残響）
    reverb = new Tone.Reverb({
      decay: 12,
      wet: 0.6,
      roomSize: 0.8
    }).toDestination()
    
    // ゲインコントロール（初期値はvolume変数に基づく）
    gain = new Tone.Gain(volume.value / 100).connect(reverb)
    
    // エンベロープ（長いアタックとリリース）
    envelope = new Tone.AmplitudeEnvelope({
      attack: 2,    // 2秒のアタック
      decay: 0.5,
      sustain: 0.8,
      release: 8    // 8秒のリリース
    }).connect(gain)
    
    // 注意：オシレーターは再生時に毎回新しく作成
    console.log('Crystal Bowl audio setup completed')
  } catch (error) {
    console.error('Failed to setup audio:', error)
  }
}

// 再生/停止
async function togglePlay() {
  try {
    // 既に処理中の場合は何もしない
    if (isTransitioning.value) {
      return
    }
    
    // 初回クリック時にオーディオコンテキストを開始
    if (!audioInitialized.value) {
      await Tone.start()
      audioInitialized.value = true
      console.log('Audio context started')
    }
    
    if (isPlaying.value) {
      // 停止処理開始
      await stopCrystalBowl()
    } else {
      // 再生処理開始
      await startCrystalBowl()
    }
  } catch (error) {
    console.error('Failed to toggle play:', error)
    isPlaying.value = false
         isTransitioning.value = false
   }
 }

// 周波数をスムーズに変更
function updateFrequencySmooth(newFreq, oldFreq) {
  try {
    if (!oscillator || oscillator.state !== 'started') return
    
    const now = Tone.now()
    const transitionTime = 0.1 // 0.1秒でスムーズに移行
    
    // 基音の周波数から新しい周波数へスムーズに変化
    oscillator.frequency.linearRampToValueAtTime(newFreq, now + transitionTime)
    // 倍音の周波数も同時に更新
    harmonicOscillators.forEach((harmOsc, index) => {
      if (harmOsc && harmOsc.state === 'started') {
        const harmonicNumber = index + 2 // 2倍音から開始
        const newHarmonicFreq = newFreq * harmonicNumber
        
        if (newHarmonicFreq <= 20000) { // 可聴域内のみ
          harmOsc.frequency.linearRampToValueAtTime(newHarmonicFreq, now + transitionTime)
        }
      }
    })
  } catch (error) {
    console.error('Failed to update frequency:', error)
  }
}

// ボリュームをスムーズに変更
function updateVolumeSmooth(newVol, oldVol) {
  try {
    if (!gain) return
    
    const now = Tone.now()
    const transitionTime = 0.1 // 0.1秒でスムーズに移行
    const gainValue = newVol / 100 // 0-100% を 0-1 に変換
    
    // 現在のボリュームから新しいボリュームへスムーズに変化
    gain.gain.linearRampToValueAtTime(gainValue, now + transitionTime)
  } catch (error) {
    console.error('Failed to update volume:', error)
  }
}

// 倍音強度をスムーズに変更
function updateHarmonicIntensity(newIntensity) {
  try {
    const now = Tone.now()
    const transitionTime = 0.1
    const intensityValue = newIntensity / 100
    
    harmonicOscillators.forEach(harmOsc => {
      if (harmOsc && harmOsc.volume) {
        harmOsc.volume.linearRampToValueAtTime(
          Tone.gainToDb(intensityValue * 0.3), // 倍音は基音の30%以下に制限
          now + transitionTime
        )
      }
    })
  } catch (error) {
    console.error('Failed to update harmonic intensity:', error)
  }
}

// 倍音数の変更
function updateHarmonicSpread(newSpread, oldSpread) {
  try {
    if (newSpread > oldSpread) {
      // 倍音を追加
      addHarmonics(newSpread - oldSpread)
    } else if (newSpread < oldSpread) {
      // 倍音を削除
      removeHarmonics(oldSpread - newSpread)
    }
  } catch (error) {
    console.error('Failed to update harmonic spread:', error)
  }
}

// 倍音オシレーターを追加
function addHarmonics(count) {
  const currentCount = harmonicOscillators.length
  for (let i = 0; i < count; i++) {
    const harmonicNumber = currentCount + i + 2 // 2倍音から開始
    const harmonicFreq = frequency.value * harmonicNumber
    
    if (harmonicFreq <= 20000) { // 可聴域内のみ
      const harmOsc = new Tone.Oscillator({
        type: 'sine',
        frequency: harmonicFreq,
        volume: Tone.gainToDb((harmonicIntensity.value / 100) * 0.3 / harmonicNumber)
      }).connect(envelope)
      
      harmOsc.start()
      harmonicOscillators.push(harmOsc)
    }
  }
}

// 倍音オシレーターを削除
function removeHarmonics(count) {
  for (let i = 0; i < count && harmonicOscillators.length > 0; i++) {
    const harmOsc = harmonicOscillators.pop()
    try {
      if (harmOsc.state === 'started') {
        harmOsc.stop()
      }
      harmOsc.dispose()
    } catch (error) {
      console.warn('Harmonic removal warning:', error)
    }
  }
}

// 安全な再生開始
async function startCrystalBowl() {
  // 古いオシレーターを完全にクリーンアップ
  cleanupOscillator()
  cleanupHarmonics()
  
  // 新しいオシレーターを作成
  oscillator = new Tone.Oscillator({
    type: 'sine',
    frequency: frequency.value
  }).connect(envelope)

  // 倍音オシレーターを作成
  createHarmonics()
  
  // 演奏開始
  oscillator.start()
  envelope.triggerAttack()
  isPlaying.value = true
  
  console.log(`Crystal Bowl playing at ${frequency.value}Hz with ${harmonicOscillators.length} harmonics and LFO`)
}

// 倍音オシレーターを初期作成
function createHarmonics() {
  for (let i = 0; i < harmonicSpread.value; i++) {
    const harmonicNumber = i + 2 // 2倍音から開始
    const harmonicFreq = frequency.value * harmonicNumber
    
    if (harmonicFreq <= 20000) { // 可聴域内のみ
      const harmOsc = new Tone.Oscillator({
        type: 'sine',
        frequency: harmonicFreq,
        volume: Tone.gainToDb((harmonicIntensity.value / 100) * 0.3 / harmonicNumber)
      }).connect(envelope)
      
      harmOsc.start()
      harmonicOscillators.push(harmOsc)
    }
  }
}

// 安全な停止処理
async function stopCrystalBowl() {
  isTransitioning.value = true
  
  try {
    // エンベロープをリリース状態にする
    if (envelope) {
      envelope.triggerRelease()
    }
    
    // リリース時間後にオシレーターを完全停止
    setTimeout(() => {
      cleanupOscillator()
      cleanupHarmonics()
      isPlaying.value = false
      isTransitioning.value = false
      console.log('Crystal Bowl stopped completely')
    }, 8000) // リリース時間（8秒）後に完全停止
    
    console.log('Crystal Bowl fade out started')
  } catch (error) {
    console.error('Stop error:', error)
    isTransitioning.value = false
  }
}
</script>
