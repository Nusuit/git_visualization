# 🚀 Quick Start Guide

Get up and running with Git Flow Visualizer in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required dependencies including Electron, React, TypeScript, and visualization libraries.

## Step 2: Start the App

```bash
npm run dev
```

The app will automatically:
- Start the Vite development server
- Compile TypeScript files
- Launch Electron
- Open DevTools for debugging

## Step 3: Select a Repository

1. When the app opens, click **"📁 Select Repository"**
2. Browse to any Git repository on your machine
3. The app will load and visualize the commit history

## Step 4: Install Git Hooks

For real-time updates:

1. Click **"Install Git Hooks"** in the app header
2. The hooks will be automatically installed to `.git/hooks/`

Or install manually:

```bash
bash scripts/install-hooks.sh /path/to/your/repo
```

## Step 5: Test Real-Time Updates

Open a terminal in your repository and make a commit:

```bash
echo "test" >> test.txt
git add test.txt
git commit -m "Test real-time visualization"
```

You should see:
- ✅ A toast notification appear
- 📊 The new commit added to the graph
- ⚡ Update within 300ms

## 🎮 Features to Try

### Replay Mode
Click the **"▶ Replay"** button to watch your commit history unfold chronologically.

### Zoom Controls
Use the zoom buttons (-, +, Reset) to navigate large repositories.

### Timeline Statistics
View author count, branch count, merge count, and date ranges.

### Recent Repositories
Previously opened repos appear for quick access.

## 🔧 Development Tips

### Hot Reload
The renderer process supports hot reload. Edit React components and see changes instantly.

### DevTools
- **Renderer**: Automatically opens (F12 to toggle)
- **Main Process**: Add `--inspect` to the electron command

### Debugging

Check the console for:
- `[SocketServer]` - Socket.IO communication
- `[HookServer]` - Git hook events
- `[GitWatcher]` - File watcher activity
- `[Main]` - Electron main process

### Common Issues

**Port Already in Use**
```bash
# Kill processes on ports 53210 and 53211
# Windows
netstat -ano | findstr :53210
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:53210 | xargs kill -9
```

**Hooks Not Executable (Unix)**
```bash
chmod +x .git/hooks/post-commit
chmod +x .git/hooks/post-merge
chmod +x .git/hooks/post-checkout
chmod +x .git/hooks/pre-push
```

## 📦 Building for Production

```bash
npm run build
```

Creates distributable apps in `release/`:
- Windows: `.exe` installer
- macOS: `.dmg` disk image
- Linux: `.AppImage` and `.deb`

## 🧪 Test the Complete Workflow

1. **Start app**: `npm run dev`
2. **Select repo**: Use the app UI
3. **Install hooks**: Click the button
4. **Make commits**: In your terminal
5. **Watch magic**: See real-time updates! ✨

## 📚 Next Steps

- Read the full [README.md](README.md)
- Explore the [Architecture](#) section
- Check out the code structure in `app/`
- Customize the theme in `tailwind.config.js`

---

**Need help?** Check the troubleshooting section in the main README!

