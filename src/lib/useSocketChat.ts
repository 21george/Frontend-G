'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'

export interface SocketMessage {
  id: string
  content: string
  sender_role: 'coach' | 'client'
  sent_at: string
  client_id: string
}

/**
 * Maintains a Socket.io connection for RECEIVING real-time messages from the
 * client. Sending always goes through the REST API — socket is used only to
 * relay the message to the client device in real time (fire-and-forget).
 */
export function useSocketChat(clientId: string) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  /** Only real-time INCOMING messages that arrived before the next REST poll. */
  const [incomingMessages, setIncomingMessages] = useState<SocketMessage[]>([])

  useEffect(() => {
    if (!clientId) return

    const apiUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const socketUrl = apiUrl.replace(/\/v1\/?$/, '')

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      auth: { client_id: clientId, role: 'coach' },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setConnected(false))

    // Only capture INCOMING messages from the client device
    socket.on('message', (msg: SocketMessage) => {
      if (msg.sender_role !== 'client') return   // ignore echo of own messages
      setIncomingMessages(prev =>
        prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
      )
    })

    socket.emit('join', { room: `client_${clientId}` })

    return () => {
      socket.emit('leave', { room: `client_${clientId}` })
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [clientId])

  /**
   * Emits the message to the socket room for real-time relay to the client.
   * Returns true if the socket was connected (i.e. relay was attempted).
   * The caller is ALWAYS responsible for also calling the REST API.
   */
  const relayViaSocket = useCallback((content: string): boolean => {
    if (!content.trim() || !socketRef.current?.connected) return false
    socketRef.current.emit('message', {
      room: `client_${clientId}`,
      content: content.trim(),
      sender_role: 'coach',
      sent_at: new Date().toISOString(),
    })
    return true
  }, [clientId])

  /** Clear incoming messages that are now covered by the REST poll. */
  const clearIncoming = useCallback((knownIds: string[]) => {
    setIncomingMessages(prev => prev.filter(m => !knownIds.includes(m.id)))
  }, [])

  return { connected, incomingMessages, relayViaSocket, clearIncoming }
}
