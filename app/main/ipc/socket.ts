import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer, createServer } from 'http';
import { InitialGraphPayload, GitEventPayload, ToastPayload } from '../types';
import { SOCKET_PORT, SOCKET_EVENTS } from '../../shared/constants';

export class SocketServer {
  private io: SocketIOServer | null = null;
  private httpServer: HTTPServer | null = null;
  private clientConnected = false;

  /**
   * Start the Socket.IO server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create HTTP server for Socket.IO
        this.httpServer = createServer();

        this.io = new SocketIOServer(this.httpServer, {
          cors: {
            origin: '*',
            methods: ['GET', 'POST'],
          },
          transports: ['websocket', 'polling'],
        });

        this.setupEventHandlers();

        this.httpServer.listen(SOCKET_PORT, '127.0.0.1', () => {
          console.log(`[SocketServer] Listening on port ${SOCKET_PORT}`);
          resolve();
        });

        this.httpServer.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`[SocketServer] Port ${SOCKET_PORT} is already in use`);
          } else {
            console.error('[SocketServer] Server error:', error);
          }
          reject(error);
        });
      } catch (error) {
        console.error('[SocketServer] Failed to start:', error);
        reject(error);
      }
    });
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log('[SocketServer] Client connected:', socket.id);
      this.clientConnected = true;

      socket.on('disconnect', () => {
        console.log('[SocketServer] Client disconnected:', socket.id);
        this.clientConnected = false;
      });

      socket.on('error', (error) => {
        console.error('[SocketServer] Socket error:', error);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Emit initial graph data to the client
   */
  emitInitialGraph(payload: InitialGraphPayload): void {
    if (!this.io || !this.clientConnected) {
      console.warn('[SocketServer] No client connected, cannot emit initial graph');
      return;
    }

    console.log(`[SocketServer] Emitting initial graph: ${payload.commits.length} commits`);
    this.io.emit(SOCKET_EVENTS.INITIAL_GRAPH, payload);
  }

  /**
   * Emit a git event (commit, merge, checkout, push)
   */
  emitGitEvent(payload: GitEventPayload): void {
    if (!this.io || !this.clientConnected) {
      console.warn('[SocketServer] No client connected, cannot emit git event');
      return;
    }

    console.log('[SocketServer] Emitting git event:', payload.type);
    this.io.emit(SOCKET_EVENTS.GIT_EVENT, payload);
  }

  /**
   * Emit a toast notification
   */
  emitToast(payload: ToastPayload): void {
    if (!this.io || !this.clientConnected) {
      return;
    }

    this.io.emit(SOCKET_EVENTS.TOAST, payload);
  }

  /**
   * Emit an error
   */
  emitError(message: string): void {
    if (!this.io) return;

    this.io.emit(SOCKET_EVENTS.ERROR, { message });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.io) {
        this.io.close(() => {
          console.log('[SocketServer] Socket.IO closed');
        });
        this.io = null;
      }

      if (this.httpServer) {
        this.httpServer.close(() => {
          console.log('[SocketServer] HTTP server closed');
          this.httpServer = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if client is connected
   */
  isClientConnected(): boolean {
    return this.clientConnected;
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.io !== null && this.httpServer !== null;
  }
}

