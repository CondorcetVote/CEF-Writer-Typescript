# CEF Writer - Architecture

This library is a faithful TypeScript port of the PHP library
[CondorcetVote/CEF-Writer](https://github.com/CondorcetVote/CEF-Writer); the file
layout intentionally mirrors the source `src/` tree.

## Project Structure

```
src/
├── index.ts          # Public API barrel
├── Cef.ts            # Streaming writer (file / WriteTarget / StringBuffer targets)
├── CefFormat.ts      # Internal validation helpers (@internal)
├── Ranking.ts        # Immutable ranking value object
├── VoteLine.ts       # Ballot value object (private ctor + named constructors)
├── CommentLine.ts    # Standalone comment line
├── Exception/        # CefFormatException hierarchy + CefWriteException
└── Parameter/        # ParameterInterface, StandardParameter + typed parameters
```

## Design Principles

1. **Faithful port** - Mirrors the source public API, architecture and output.
2. **Type Safety** - Full TypeScript support with strict mode.
3. **Zero runtime dependencies** - The file target uses only Node's `fs`.
4. **Streaming** - Every `add*()` call writes exactly one line immediately.
5. **Format-safe** - Specification rules are enforced; invalid input throws.

## Notable TypeScript adaptations

- "Invalid UTF-8" is detected as an ill-formed string carrying an unpaired
  UTF-16 surrogate.
- The PHP "string passed by reference" target is modeled by the `StringBuffer`
  value object; file output goes through the `WriteTarget` interface.
- PHP named arguments become an options object on `VoteLine.fromRanking`,
  `VoteLine.fromRawRankingString` and `Cef.addRawVote`.

## Building

Run `bun run build` (or `npm run build`) to compile TypeScript to JavaScript.
Output is generated in the `dist/` directory.

## Testing

Run `bun test` to execute the suite (345 tests under `tests/Unit` and
`tests/Feature`).
