# CEF Writer - Architecture

## Project Structure

```
src/
├── index.ts          # Main entry point
├── types/            # TypeScript type definitions
├── core/             # Core functionality
└── utils/            # Utility functions
```

## Design Principles

1. **Type Safety** - Full TypeScript support with strict mode
2. **Zero Dependencies** - Minimal external dependencies
3. **Composability** - Build complex CEF documents from simple components
4. **Clarity** - Clear and intuitive API

## Building

Run `npm run build` to compile TypeScript to JavaScript.

Output is generated in the `dist/` directory.

## Testing

Run `npm test` to execute tests.
