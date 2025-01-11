import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useWebSocketStore = defineStore('websocket', () => {
  const ws = ref(null)
  const clientId = ref(Date.now().toString())
  const isConnected = ref(false)
  const voiceQueues = ref({})

  const connectWebSocket = () => {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://localhost:8000/ws/${clientId.value}`
      
      try {
        if (ws.value) {
          console.log('Closing existing WebSocket connection')
          ws.value.close()
        }

        console.log('Creating new WebSocket connection')
        ws.value = new WebSocket(wsUrl)
        
        const connectionTimeout = setTimeout(() => {
          console.log('WebSocket connection timeout')
          isConnected.value = false
          reject(new Error('Connection timeout'))
        }, 5000)

        ws.value.onopen = () => {
          console.log('WebSocket connection established')
          clearTimeout(connectionTimeout)
          isConnected.value = true
          const initMessage = {
            type: 'init',
            clientId: clientId.value
          }
          ws.value.send(JSON.stringify(initMessage))
          resolve()
        }

        ws.value.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            handleWebSocketMessage(data)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        ws.value.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason)
          clearTimeout(connectionTimeout)
          isConnected.value = false
          // if the connection is not established, reject
          if (!isConnected.value) {
            reject(new Error('WebSocket connection closed'))
          }
          setTimeout(() => connectWebSocket().catch(console.error), 5000)
        }

        ws.value.onerror = (error) => {
          console.error('WebSocket error occurred:', error)
          clearTimeout(connectionTimeout)
          isConnected.value = false
          reject(error)
        }
      } catch (error) {
        console.error('Error creating WebSocket connection:', error)
        isConnected.value = false
        setTimeout(() => connectWebSocket().catch(console.error), 5000)
        reject(error)
      }
    })
  }

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'init_response':
        break
      case 'note_data':
        if (data.noteData && data.voiceId) {
          // add note data to the voice queue
          voiceQueues.value = {
            ...voiceQueues.value,
            [data.voiceId]: [
              ...(voiceQueues.value[data.voiceId] || []),
              ...data.noteData
            ]
          }
        }
        break
      case 'error':
        console.error('Server error:', data.message)
        break
    }
  }

  const sendMessage = (message) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(message))
    }
  }

  const getVoiceQueue = (voiceId) => {
    return voiceQueues.value[voiceId] || []
  }

  const clearVoiceQueue = (voiceId) => {
    voiceQueues.value = {
      ...voiceQueues.value,
      [voiceId]: []
    }
  }

  const updateVoiceQueue = (voiceId, queue) => {
    voiceQueues.value = {
      ...voiceQueues.value,
      [voiceId]: queue
    }
  }

  return {
    isConnected,
    sendMessage,
    getVoiceQueue,
    clearVoiceQueue,
    connectWebSocket,
    updateVoiceQueue
  }
}) 