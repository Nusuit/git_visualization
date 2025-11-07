# Contributing to Git Flow Visualizer

Thank you for considering contributing to Git Flow Visualizer! 🎉

## Code Standards

### Clean Code Principles

> "Write code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live."

We take this seriously! Follow these guidelines:

1. **No Hardcoded Values**
   - Use constants from `app/shared/constants.ts`
   - Configure via environment or config files
   - Make magic numbers meaningful

   ```typescript
   // ❌ Bad
   const delay = 200;
   
   // ✅ Good
   const delay = FILE_WATCHER_DEBOUNCE_MS;
   ```

2. **Use Tailwind CSS**
   - All styling must use Tailwind utility classes
   - No inline styles or separate CSS files for components
   - Use the custom classes defined in `styles.css`

   ```tsx
   // ❌ Bad
   <div style={{ backgroundColor: '#1e1e1e' }}>
   
   // ✅ Good
   <div className="bg-dark-100">
   ```

3. **TypeScript Strict Mode**
   - No `any` types (use `unknown` if needed)
   - Define interfaces for all data structures
   - Proper error handling with types

4. **Meaningful Names**
   - Functions do what their names say
   - Variables are descriptive
   - No abbreviations unless universal

## Project Structure

```
app/
├── main/           # Electron main process (Node.js)
├── preload/        # Preload scripts (bridge)
├── renderer/       # React frontend (browser)
└── shared/         # Shared types and constants
```

## Development Workflow

### 1. Setup

```bash
git clone <your-fork>
cd git-flow-visualizer
npm install
```

### 2. Create Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Development

```bash
npm run dev
```

### 4. Type Check

```bash
npm run type-check
```

### 5. Commit

Follow conventional commits:
- `feat: Add new feature`
- `fix: Fix bug`
- `docs: Update documentation`
- `style: Format code`
- `refactor: Refactor code`
- `test: Add tests`
- `chore: Update dependencies`

### 6. Pull Request

- Write a clear description
- Reference any issues
- Include screenshots for UI changes
- Ensure type checking passes

## Areas to Contribute

### 🐛 Bug Fixes
- Check open issues
- Reproduce the bug
- Fix and test
- Submit PR

### ✨ Features
- Discuss in issues first
- Follow existing patterns
- Add documentation
- Test thoroughly

### 📚 Documentation
- Improve README
- Add code comments
- Create tutorials
- Fix typos

### 🎨 UI/UX
- Enhance visualizations
- Improve animations
- Better color schemes
- Accessibility improvements

## Testing

Currently, testing is manual:

1. Load various repository sizes
2. Test real-time updates
3. Verify cross-platform compatibility
4. Check memory usage with large repos

**Future**: We welcome contributions for automated testing!

## Code Review

All submissions require review. We look for:

- ✅ Follows code standards
- ✅ No hardcoded values
- ✅ Uses Tailwind CSS
- ✅ TypeScript types are correct
- ✅ Functions are focused and clear
- ✅ Documentation is updated

## Questions?

Open an issue for discussion before starting major work!

---

Happy coding! 🚀

