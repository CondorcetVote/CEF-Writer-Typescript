# AI Agents Instructions

This document provides guidelines for AI assistants (like GitHub Copilot, Claude, etc.) working on this repository.

## Development Environment

### Package Manager
- **Primary**: Use **Bun** for development (`bun install`, `bun run`)
- **For end-users**: Any package manager is acceptable (npm, yarn, pnpm, bun)

### Commands
```bash
# Setup development environment with Bun
bun install
bun run dev           # Start TypeScript watch mode
bun run build         # Compile TypeScript
bun run lint          # Check code quality
bun run lint:fix      # Auto-fix linting issues
bun run format        # Format code with Prettier
bun run type-check    # Verify TypeScript types
bun test              # Run tests
```

## Code Style & Standards

### TypeScript
- **Strict Mode**: Always enabled (`strict: true` in tsconfig.json)
- **No implicit any**: Forbidden
- **Explicit return types**: Required for all functions
- **No unused variables/parameters**: Clean code only
  - Unused parameters can be prefixed with `_` to suppress warnings

### Imports & Exports
- Use explicit named exports in module files
- Default exports only for main entry point (`src/index.ts`)
- Keep imports at the top of files

### Code Quality
- Run `bun run lint:fix` before committing
- Run `bun run format` to maintain consistent formatting
- All code must pass `bun run type-check`

## Commits & Contributions

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code formatting (no logic changes)
- `refactor:` Code restructuring
- `test:` Test additions/changes
- `chore:` Dependencies, build config

Example: `feat: add CEF validation for event data`

### Pull Requests
1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes following the code standards above
3. Run full validation: `bun run lint && bun run type-check && bun run build`
4. Write clear commit messages
5. Open PR with description of changes

## Project Structure

```
src/
├── index.ts              # Public API exports
├── types/                # TypeScript interfaces & types
├── core/                 # Core CEF functionality
│   └── writer.ts         # Main CEF writer class
└── utils/                # Helper functions
    └── sanitize.ts       # CEF field sanitization

docs/                     # Documentation
.github/workflows/        # CI/CD pipelines
```

## Testing

- Write tests for new features
- Test file pattern: `*.test.ts`
- Run: `bun test`
- Aim for good coverage of public API

## Documentation

- Update README.md for user-facing features
- Update CHANGELOG.md for all changes
- Add JSDoc comments to exported functions/classes
- Keep docs/ directory updated for guides

## Key Principles

1. **Type Safety**: Leverage TypeScript's strict mode
2. **Zero Dependencies**: Avoid external dependencies when possible
3. **Clear API**: Intuitive, well-documented public interface
4. **Backward Compatibility**: Maintain semver compliance
5. **Code Review**: Self-review before suggesting changes

## Common Tasks

### Adding a new feature
1. Create types in `src/types/`
2. Implement in appropriate `src/core/` or `src/utils/` module
3. Export from `src/index.ts`
4. Add tests
5. Update documentation

### Fixing a bug
1. Write a test that reproduces the bug
2. Fix the implementation
3. Verify test passes
4. Update CHANGELOG.md

### Refactoring
1. Ensure all tests pass before and after
2. Keep the public API unchanged
3. Update JSDoc if behavior changes

## GitHub Actions & CI

The CI pipeline (`.github/workflows/ci.yml`) runs on every push and PR:
- Linting with ESLint
- Type checking with TypeScript
- Building the project
- Running tests
- Auto-publishing to npm on main branch pushes (requires NPM_TOKEN)

Ensure all checks pass before merging.

## Notes for AI Assistants

- When suggesting code, prioritize clarity and maintainability
- Always consider TypeScript strict mode implications
- Use the existing codebase as reference for style
- Suggest tests alongside feature implementations
- Update CHANGELOG.md when proposing changes
- Verify no breaking changes to public API
