import express, { Request, Response } from 'express';
import { Server as HTTPServer } from 'http';
import { HookEventRequest } from '../types';
import { HTTP_SERVER_HOST, HTTP_SERVER_PORT } from '../../shared/constants';

export class HookServer {
  private app: express.Application;
  private server: HTTPServer | null = null;
  private eventCallback: ((event: HookEventRequest) => void) | null = null;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok' });
    });

    // Main event endpoint that git hooks will POST to
    this.app.post('/event', (req: Request, res: Response) => {
      try {
        const event: HookEventRequest = req.body;

        console.log('[HookServer] Received event:', event);

        // Validate the event
        if (!event.repo || !event.event) {
          res.status(400).json({ error: 'Missing required fields: repo, event' });
          return;
        }

        // Call the registered callback
        if (this.eventCallback) {
          this.eventCallback(event);
        }

        res.json({ success: true });
      } catch (error) {
        console.error('[HookServer] Error processing event:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  /**
   * Start the HTTP server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(HTTP_SERVER_PORT, HTTP_SERVER_HOST, () => {
          console.log(`[HookServer] Listening on http://${HTTP_SERVER_HOST}:${HTTP_SERVER_PORT}`);
          resolve();
        });

        this.server.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`[HookServer] Port ${HTTP_SERVER_PORT} is already in use`);
          } else {
            console.error('[HookServer] Server error:', error);
          }
          reject(error);
        });
      } catch (error) {
        console.error('[HookServer] Failed to start server:', error);
        reject(error);
      }
    });
  }

  /**
   * Stop the HTTP server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        const serverToClose = this.server;
        serverToClose.close(() => {
          console.log('[HookServer] Server stopped');
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Register a callback to handle incoming events
   */
  onEvent(callback: (event: HookEventRequest) => void): void {
    this.eventCallback = callback;
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.server !== null;
  }
}

