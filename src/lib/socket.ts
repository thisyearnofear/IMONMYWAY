import { io, Socket } from 'socket.io-client'
import type { SocketEvents } from '@/types'

class SocketManager {
  private socket: Socket | null = null
  private static instance: SocketManager

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager()
    }
    return SocketManager.instance
  }

  connect(): Socket {
    if (!this.socket) {
      // Use environment variable or fallback to SSL domain
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://imonmywayapi.persidian.com:3001'
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        secure: true,
        rejectUnauthorized: false // May need this for self-signed certs
      })
    }
    return this.socket
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }
}

export const socketManager = SocketManager.getInstance()
export const getSocket = () => socketManager.getSocket()