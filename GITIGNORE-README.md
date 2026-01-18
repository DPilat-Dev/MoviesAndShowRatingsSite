# Git Ignore Configuration for Bosnia Movie Rankings

This project now has proper `.gitignore` configuration to prevent tracking of unnecessary files.

## Files Created

1. **`.gitignore`** (root) - Main gitignore file with comprehensive patterns
2. **`backend/.gitignore`** - Backend-specific patterns
3. **`frontend/.gitignore`** - Frontend-specific patterns
4. **`cleanup-git-repo.sh`** - Script to clean up already-tracked files

## What's Ignored

### Common Patterns (all locations)
- `node_modules/` - Dependencies (should be installed via `npm install`)
- `dist/`, `build/` - Build outputs
- `*.log` - Log files
- `.env`, `.env.local` - Environment files with secrets
- `.DS_Store`, `Thumbs.db` - OS metadata files
- `.vscode/`, `.idea/` - Editor configurations
- `*.db`, `*.sqlite*` - Database files
- `coverage/` - Test coverage reports

### Backend-specific
- `prisma/migrations/` - Database migrations (except lock file)
- `backend.log` - Backend application logs

### Frontend-specific
- `.vite/` - Vite cache
- Build artifacts

## Important Notes

### Already Tracked Files
Some files that should be ignored are already tracked in the repository:
- `node_modules/` files in both backend and frontend
- `.env` files
- `*.log` files
- `*.db` files

These were committed before the `.gitignore` was set up. To clean them up:

1. Run the cleanup script:
   ```bash
   ./cleanup-git-repo.sh
   ```

2. Or manually remove them:
   ```bash
   git rm -r --cached backend/node_modules frontend/node_modules
   git rm --cached backend/.env frontend/.env
   git rm --cached backend/backend.log frontend/frontend.log
   git rm --cached backend/prisma/dev.db
   git commit -m "Remove ignored files from git tracking"
   ```

### Files to Keep
The following files ARE tracked (and should be):
- `.env.example` - Template for environment variables
- `package.json`, `package-lock.json` - Dependency definitions
- Source code in `src/` directories
- Configuration files
- Documentation

## Best Practices

1. **Never commit secrets**: Use `.env.example` as a template
2. **Install dependencies locally**: Run `npm install` in both `backend/` and `frontend/`
3. **Build locally**: Build outputs should not be committed
4. **Use the cleanup script**: If you accidentally commit ignored files

## Environment Setup

1. Copy example environment files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. Edit the `.env` files with your actual values
3. Add `.env` to `.gitignore` (already done)

## Docker Considerations

Docker volumes (like `postgres_data` and `backend_data`) are managed by Docker and not part of the repository. They're created when you run `docker-compose up`.

## Testing

Test files (like `test-*.html`) are ignored as they're for local testing only.