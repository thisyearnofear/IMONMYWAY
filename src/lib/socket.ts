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
      this.socket = io({
        transports: ['websocket', 'polling']
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