# Contributing to CEF Writer

First off, thanks for taking the time to contribute! 🎉

## Code of Conduct

Be respectful and constructive in your interactions with others.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check if the issue already exists. When creating a bug report, include:

- **Clear description** of what the bug is
- **Steps to reproduce** the behavior
- **Expected behavior** vs **actual behavior**
- **Environment** (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion include:

- **Clear description** of the enhancement
- **Use case** and why it would be useful
- **Possible implementation** (optional)

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run `npm run lint:fix` to format your code
5. Run `npm run type-check` to verify types
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

## Code Style

- Follow the existing code style
- Use TypeScript
- Write meaningful commit messages
- Use [Conventional Commits](https://www.conventionalcommits.org/)

## Commit Messages

We follow the Conventional Commits specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for code style changes
- `refactor:` for code refactoring
- `test:` for test changes
- `chore:` for dependency updates and other chores

Example: `feat: add support for custom CEF extensions`
