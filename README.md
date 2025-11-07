# 🌊 Git Flow Visualizer

A beautiful, real-time desktop application for visualizing Git commit graphs with live updates.

![Git Flow Visualizer](https://img.shields.io/badge/Electron-React-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📥 Download

### Latest Release

**Windows:** [Download Git Flow Visualizer Setup.exe](https://github.com/Nusuit/git_visualization/releases/download/v1.0.0/Git.Flow.Visualizer.Setup.1.0.0.exe)

> Just download and run the installer. No Node.js or dependencies required!

---

## ✨ Features

- 🎨 **Beautiful Visualization** - Interactive commit graph with branches and merges
- ⚡ **Real-Time Updates** - See commits appear instantly as you make them
- 🎬 **Replay Mode** - Watch your commit history unfold chronologically
- 📊 **Statistics** - Authors, branches, merges, and timeline data
- 🎯 **Zoom & Pan** - Explore large repositories with ease
- 🌙 **Dark/Light Theme** - Switch between themes
- 💾 **Recent Repos** - Quick access to previously opened repositories

## 🚀 Quick Start

### For Users

1. **Download** the installer from above
2. **Run** the `.exe` file
3. **Select** your Git repository
4. **Install Git Hooks** (optional, for real-time updates)
5. **Enjoy** visualizing your commits!

### For Developers

```bash
# Clone the repository
git clone https://github.com/Nusuit/git_visualization.git
cd git_visualization

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## 📖 How to Use

1. **Select Repository** - Browse for any Git repository on your computer
2. **Install Hooks** - Click "Install Git Hooks" for real-time updates
3. **Make Commits** - Watch them appear automatically in the graph
4. **Replay Mode** - Click "▶️ Replay" to see your entire history animated
5. **Filter & Search** - Use filters to explore specific commits or authors

## 🎬 Replay Feature

The replay mode lets you watch your entire Git history unfold chronologically:

- Camera automatically follows new commits
- Smooth animations and transitions
- Progress indicators
- Can be stopped at any time

## 🔧 Tech Stack

- **Electron** - Desktop framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Socket.IO** - Real-time updates
- **GitGraph.js** - Commit visualization

## 🛠️ Development Scripts

```bash
npm run dev              # Run in development
npm run build            # Build for production
npm run type-check       # Check TypeScript errors
```

## � Build Output

After running `npm run build`, find the installer in:

```
release/
└── Git Flow Visualizer Setup 1.0.0.exe
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

MIT License - feel free to use this in your own projects!

---

**Made with ❤️ for developers who love beautiful Git visualizations**
