# 🏗️ Architecture Documentation

## System Overview

Git Flow Visualizer is an Electron desktop application with a clear separation between backend (Node.js) and frontend (React).

```
┌─────────────────────────────────────────────────────────┐
│                    Electron App                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │  Main Process    │◄───────►│ Renderer Process │    │
│  │   (Node.js)      │  IPC    │     (React)      │    │
│  │                  │ Socket  │                  │    │
│  └────────┬─────────┘         └──────────────────┘    │
│           │                                             │
│           │                                             │
│  ┌────────▼──────────────────────────────────────┐    │
│  │  Git Repository (.git/)                       │    │
│  │  ┌─────────────┐  ┌──────────────────────┐  │    │
│  │  │   Hooks     │  │  .git/logs/HEAD      │  │    │
│  │  │  (HTTP POST)│  │  (File Watcher)      │  │    │
│  │  └─────────────┘  └──────────────────────┘  │    │
│  └───────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Main Process (Backend)

**Location**: `app/main/`

#### Git Service (`git/gitService.ts`)
- Interfaces with Git via `simple-git`
- Parses commit logs
- Extracts branch and tag information
- **Key Methods**:
  - `getFullLog()` - Get all commits
  - `getCommit(hash)` - Get single commit
  - `getCurrentBranch()` - Get active branch

#### Hook Server (`git/hookServer.ts`)
- Express HTTP server on port 53210
- Receives POST requests from Git hooks
- Validates and processes events
- **Endpoints**:
  - `POST /event` - Receive git events
  - `GET /health` - Health check

#### Git Watcher (`git/watcher.ts`)
- Monitors `.git/logs/HEAD` with chokidar
- Fallback when hooks fail
- Debounced to prevent spam
- Parses log entries to determine event type

#### Socket Server (`ipc/socket.ts`)
- Socket.IO server on port 53211
- One-to-one connection with renderer
- **Events Emitted**:
  - `initial_graph` - Full commit history
  - `git_event` - New commit/merge/checkout
  - `toast` - Notification messages
  - `error` - Error messages

#### Config Store (`storage/configStore.ts`)
- Persistent user preferences
- Uses `electron-store`
- Stores recent repos, theme, settings

### 2. Preload Script

**Location**: `app/preload/index.ts`

- Bridges main and renderer processes
- Exposes safe IPC methods via `contextBridge`
- No direct Node.js access from renderer

### 3. Renderer Process (Frontend)

**Location**: `app/renderer/src/`

#### App (`App.tsx`)
- Root component
- Manages global state
- Coordinates socket events
- Routes between views

#### RepoPicker (`components/RepoPicker.tsx`)
- Initial screen
- Repository selection
- Recent repos list
- Triggers repo loading

#### GraphView (`components/GraphView.tsx`)
- Main visualization
- Zoom/pan controls
- Commit details panel
- Hook installation UI

#### Timeline (`components/Timeline.tsx`)
- Statistics display
- Replay mode control
- Filter controls (future)
- Date range information

#### EventToast (`components/EventToast.tsx`)
- Toast notification system
- Auto-dismiss after 5s
- Animated entrance/exit
- Color-coded by type

#### GitGraph Renderer (`lib/gitGraph.ts`)
- Wraps `@gitgraph/js`
- Manages graph state
- Handles incremental updates
- Branch color assignment

#### Socket Client (`lib/socket.ts`)
- Socket.IO client
- Event listener management
- Reconnection handling
- Typed event system

## Data Flow

### Initial Load

```
User Selects Repo
       ↓
Renderer → IPC → Main Process
                      ↓
                 GitService.getFullLog()
                      ↓
                 Parse commits
                      ↓
                 SocketServer.emitInitialGraph()
                      ↓
                 SocketClient receives
                      ↓
                 GraphView renders
```

### Real-Time Update (Hook)

```
Git Commit
    ↓
post-commit hook executes
    ↓
curl POST to localhost:53210
    ↓
HookServer receives
    ↓
Main Process: GitService.getCommit(hash)
    ↓
SocketServer.emitGitEvent()
    ↓
Renderer: handleGitEvent()
    ↓
GraphView: addCommit() with animation
```

### Real-Time Update (Fallback)

```
Git Commit
    ↓
.git/logs/HEAD modified
    ↓
Chokidar detects change (debounced 200ms)
    ↓
GitWatcher parses last line
    ↓
Determines event type
    ↓
GitService.getCommit(hash)
    ↓
SocketServer.emitGitEvent()
    ↓
Renderer updates
```

## Communication Protocols

### IPC (Inter-Process Communication)

Used for request-response patterns:

```typescript
// Renderer → Main
const result = await window.electronAPI.loadRepo(path);

// Main Process Handler
ipcMain.handle('load-repo', async (event, repoPath) => {
  // Handle request
  return { success: true };
});
```

### Socket.IO

Used for server → client push notifications:

```typescript
// Main Process
socketServer.emitGitEvent({
  type: 'commit',
  commit: commitData
});

// Renderer
socketClient.on('git_event', (data) => {
  // Handle event
});
```

### HTTP (Git Hooks)

Git hooks use HTTP POST:

```bash
curl -s -X POST http://127.0.0.1:53210/event \
  -H "Content-Type: application/json" \
  -d '{"repo":"/path","event":"commit","hash":"abc123"}'
```

## Security Model

### Localhost Only

- HTTP server: `127.0.0.1:53210`
- Socket.IO: `127.0.0.1:53211`
- No external network access
- No data leaves machine

### Context Isolation

- Renderer has no Node.js access
- Preload script is the only bridge
- Limited IPC methods exposed
- No arbitrary code execution

### Safe Git Operations

- Read-only git operations
- No destructive commands
- User must manually commit/push
- Hooks are non-blocking

## Performance Considerations

### Commit Loading

- Limit to 5,000 commits via `MAX_COMMITS_TO_LOAD`
- Stream processing for large repos
- Lazy rendering in graph

### Real-Time Updates

- Debounced file watcher (200ms)
- Single socket connection
- Incremental graph updates
- No full re-renders

### Memory Management

- Cleanup on repo change
- Socket disconnection on unmount
- Graph destruction on clear
- No memory leaks in long sessions

## Error Handling

### Git Operations
```typescript
try {
  const commits = await gitService.getFullLog();
} catch (error) {
  socketServer.emitToast({
    type: 'error',
    message: 'Failed to load commits'
  });
}
```

### Socket Events
```typescript
socket.on('error', (error) => {
  console.error('[Socket] Error:', error);
  // Attempt reconnection
});
```

### Hook Server
```typescript
// Hooks fail silently
curl ... || true  # Don't block git operations
```

## Extension Points

### Add New Git Events

1. Create hook script in `scripts/hooks/`
2. Add event type to `types.ts`
3. Handle in `handleHookEvent()`
4. Update renderer UI

### Custom Visualizations

1. Extend `GitGraphRenderer`
2. Add new template options
3. Implement custom rendering logic

### Additional Storage

1. Extend `ConfigStore`
2. Add methods for new settings
3. Update IPC handlers
4. Use in renderer

## File Structure

```
app/
├── main/
│   ├── index.ts                 # Entry point
│   ├── types.ts                 # Backend types
│   ├── git/
│   │   ├── gitService.ts        # Git operations
│   │   ├── hookServer.ts        # HTTP server
│   │   └── watcher.ts           # File watcher
│   ├── ipc/
│   │   └── socket.ts            # Socket.IO server
│   └── storage/
│       └── configStore.ts       # Persistent config
├── preload/
│   └── index.ts                 # IPC bridge
├── renderer/
│   ├── index.html               # Entry HTML
│   └── src/
│       ├── main.tsx             # React entry
│       ├── App.tsx              # Root component
│       ├── types.ts             # Frontend types
│       ├── components/          # React components
│       └── lib/                 # Utilities
└── shared/
    └── constants.ts             # Shared constants
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop Framework | Electron 28 | Cross-platform desktop |
| Backend Runtime | Node.js | System operations |
| Frontend Framework | React 18 | UI library |
| Language | TypeScript 5.3 | Type safety |
| Build Tool | Vite 5 | Fast dev/build |
| Styling | Tailwind CSS 3.4 | Utility-first CSS |
| Animation | Framer Motion 10 | Smooth animations |
| Real-time | Socket.IO 4 | Bidirectional events |
| Git Interface | simple-git 3 | Git commands |
| Visualization | @gitgraph/js 1.4 | Commit graph |
| File Watching | chokidar 3 | FS monitoring |
| Storage | electron-store 8 | Config persistence |

## Build Process

```
TypeScript Compilation
        ↓
tsconfig.main.json → dist/main/
tsconfig.preload.json → dist/preload/
        ↓
Vite Build
        ↓
React → dist/renderer/
        ↓
Electron Builder
        ↓
Package with hooks → release/
```

---

This architecture ensures:
- ✅ Clear separation of concerns
- ✅ Type safety throughout
- ✅ Real-time responsiveness
- ✅ Local-only operation
- ✅ Extensibility
- ✅ Performance at scale

