# CEF Writer

A TypeScript library for writing CEF (Common Event Format) documents.

## Features

- 🎯 Type-safe CEF writing
- 📦 Lightweight and zero-dependency
- 🔧 Easy to use API
- 📝 Full TypeScript support
- ✨ Modern ES2020+ support

## Installation

```bash
npm install cef-writer
# or
yarn add cef-writer
# or
pnpm add cef-writer
```

## Development

### Setup

```bash
# Using Bun (recommended for development)
bun install
bun run dev

# Or with your preferred package manager
npm install
npm run dev
```

### Available Scripts

- `bun run build` - Compile TypeScript
- `bun run lint` - Check code quality
- `bun run lint:fix` - Auto-fix linting issues
- `bun run format` - Format code with Prettier
- `bun run type-check` - Verify types
- `bun test` - Run tests

## Quick Start

```typescript
import { createCEF } from 'cef-writer';

const cef = createCEF({
  // Configuration here
});

console.log(cef);
```

## Documentation

For detailed documentation, please refer to the [documentation](./docs) directory.

## Contributing

Contributions are welcome! Please read our [contributing guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes in each version.
