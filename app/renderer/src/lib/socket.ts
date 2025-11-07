import { io, Socket } from 'socket.io-client';
import { InitialGraphPayload, GitEventPayload, ToastPayload } from '../types';

const SOCKET_PORT = 53211;

export class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(`http://127.0.0.1:${SOCKET_PORT}`, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 10,
        });

        this.socket.on('connect', () => {
          console.log('[SocketClient] Connected to server');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('[SocketClient] Connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('[SocketClient] Disconnected from server');
        });

        this.setupEventListeners();
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Forward socket events to registered listeners
    this.socket.on('initial_graph', (data: InitialGraphPayload) => {
      this.emit('initial_graph', data);
    });

    this.socket.on('git_event', (data: GitEventPayload) => {
      this.emit('git_event', data);
    });

    this.socket.on('toast', (data: ToastPayload) => {
      this.emit('toast', data);
    });

    this.socket.on('error', (data: { message: string }) => {
      this.emit('error', data);
    });
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Singleton instance
export const socketClient = new SocketClient();

