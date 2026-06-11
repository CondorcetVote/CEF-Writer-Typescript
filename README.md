# CEF Writer Typescript

A TypeScript library that streams valid [Condorcet Election Format](https://github.com/CondorcetVote/CondorcetElectionFormat) (CEF) documents to a file or string buffer with a friendly object API.

This is a faithful TypeScript port of the PHP library [CondorcetVote/CEF-Writer](https://github.com/CondorcetVote/CEF-Writer): same public API, same architecture, same guarantees.

- **Streaming**: every `add*()` call writes one line immediately — nothing is buffered, nothing can be edited afterwards.
- **Format-safe**: the spec's syntactic rules (reserved characters, blank-ballot sentinel, single-line constraints, parameter-before-vote ordering) are enforced. Invalid input throws.
- **Semantics-free on purpose**: this library checks format, never election logic (it will, for example, happily let a vote reference a candidate that is not in `#/Candidates:`).
- **Zero runtime dependencies** and full TypeScript types.
- Works with a filesystem path, any `WriteTarget`, or a `StringBuffer`.

## Requirements

- Node.js 24+ (ES2024, ESM only)
- Bun (compatible with modern versions)
- Modern browsers with ES2024 support (Chrome 127+, Firefox 133+, Safari 18+, Edge 127+)

For file output in Node.js, the native `node:fs` API is used.

## Installation

```bash
npm install @condorcet.vote/cef-writer
# or
yarn add @condorcet.vote/cef-writer
# or
pnpm add @condorcet.vote/cef-writer
# or
bun add @condorcet.vote/cef-writer
```

## Quick start

```typescript
import {
  Cef,
  CommentLine,
  VoteLine,
  CandidatesParameter,
  ImplicitRankingParameter,
  WeightAllowedParameter,
} from '@condorcet.vote/cef-writer';

const cef = new Cef({ file: '/tmp/election.cvotes' });

cef.addComment(new CommentLine('My beautiful election'));
cef.addParameter(new CandidatesParameter(['Alice', 'Bob', 'Charlie']));
cef.addParameter(new ImplicitRankingParameter(true));
cef.addParameter(new WeightAllowedParameter(true));

cef.addVote(VoteLine.fromRanking([['Alice'], ['Bob'], ['Charlie']], { quantifier: 42 }));
cef.addVote(VoteLine.fromRanking([['Charlie'], ['Alice', 'Bob']], { weight: 7, quantifier: 8 }));
cef.addVote(VoteLine.fromRanking([])); // blank ballot (/EMPTY_RANKING/)

cef.close();
```

produces:

```
# My beautiful election
#/Candidates: Alice ; Bob ; Charlie
#/Implicit Ranking: true
#/Weight Allowed: true

Alice > Bob > Charlie * 42
Charlie > Alice = Bob ^7 * 8
/EMPTY_RANKING/
```

## Browser usage

The library is distributed as modern ESM and can be used in browser environments. File operations (`FileWriteTarget`) require Node.js, but you can use `StringBuffer` or implement a custom `WriteTarget` for browser-based workflows:

```typescript
import {
  Cef,
  VoteLine,
  CandidatesParameter,
  StringBuffer,
} from '@condorcet.vote/cef-writer';

// In browser: use StringBuffer to generate CEF as a string
const buffer = new StringBuffer();
const cef = new Cef({ string: buffer });

cef.addParameter(new CandidatesParameter(['Alice', 'Bob', 'Charlie']));
cef.addVote(VoteLine.fromRanking([['Alice'], ['Bob'], ['Charlie']]));

const csvContent = buffer.toString();
console.log(csvContent);

// Download the file client-side
const blob = new Blob([csvContent], { type: 'text/plain' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'election.cvotes';
link.click();
```

Or implement your own `WriteTarget` for custom backends:

```typescript
class CustomTarget implements WriteTarget {
  private lines: string[] = [];

  write(chunk: string): number {
    this.lines.push(chunk);
    return chunk.length;
  }

  getLinesArray(): string[] {
    return this.lines;
  }
}

const target = new CustomTarget();
const cef = new Cef({ file: target });
// ... add parameters and votes
```

## Output targets

The `Cef` constructor takes an options object with **exactly one** of the
following keys:

| Option | Type | Behavior |
| --- | --- | --- |
| `file: path` | `string` | A filesystem path, opened with mode `w` (created/truncated). **Node.js only.** |
| `file: target` | `WriteTarget` | Any object with `write(chunk: string): number` (e.g. an already-open `FileWriteTarget`); used as-is. |
| `string: buffer` | `StringBuffer` | Each line is appended to the supplied buffer. |

The "string passed by reference" target of the PHP original maps to the
`StringBuffer` value object — the idiomatic TypeScript stand-in:

```typescript
import { Cef, CandidatesParameter, StringBuffer } from '@condorcet.vote/cef-writer';

const buffer = new StringBuffer();
const cef = new Cef({ string: buffer });

cef.addParameter(new CandidatesParameter(['A', 'B']));

console.log(buffer.toString()); // "#/Candidates: A ; B\n"
```

`cef.file` is the active `WriteTarget` in file mode and `null` in string mode.
Call `cef.close()` to close the underlying file descriptor when you are done
(no-op in string mode).

## `autoFormat`

`cef.autoFormat` is a public `boolean` (default `true`):

- `true` — writes the readable flavor of the spec: spaces around `>`, `=`, `;`, `,`, `||`, `^`, `*`; one blank line is inserted automatically between the parameter block and the first vote.
- `false` — writes the compact form with no optional whitespace and no auto blank line.

```typescript
cef.autoFormat = false;
cef.addParameter(new CandidatesParameter(['A', 'B']));
cef.addVote(VoteLine.fromRanking([['A'], ['B']]));
// "#/Candidates:A;B\nA>B\n"
```

## Building blocks

### Parameters

Each standard parameter has its own typed class. Custom parameters are supported
via `CustomParameter`. The `StandardParameter` enum lists the exact spec names.

| Class | Parameter | Value |
| --- | --- | --- |
| `CandidatesParameter` | `Candidates` | `string[]` |
| `NumberOfSeatsParameter` | `Number of Seats` | integer ≥ 1 |
| `ImplicitRankingParameter` | `Implicit Ranking` | `boolean` |
| `VotingMethodsParameter` | `Voting Methods` | `string[]` |
| `WeightAllowedParameter` | `Weight Allowed` | `boolean` |
| `CustomParameter` | (free-form) | `(name: string, value: string)` |

Parameters can only be added before the first vote — any later call throws
`InvalidWriterStateException`.

### Vote lines

`VoteLine` instances are built through static named constructors — its
constructor is private, so never use `new VoteLine(...)`.

The typed way — `VoteLine.fromRanking()` — then pass it to `cef.addVote()`:

```typescript
VoteLine.fromRanking(
  [['Alice'], ['Bob', 'Charlie']], // [] => /EMPTY_RANKING/
  {
    tags: ['voter@example.com'],
    weight: 7,
    quantifier: 3,
    inlineComment: 'late ballot',
  },
);
```

Each rank is itself a list of tied candidates. An empty top-level ranking emits
the `/EMPTY_RANKING/` blank-ballot sentinel.

The first argument also accepts a ready-made `Ranking` object (see below). Once
built, the parsed ranking is exposed on the read-only `voteLine.ranking`
property (use `voteLine.ranking.ranks` for the `string[][]` structure). It is
`null` only when the ballot was built verbatim via
`VoteLine.fromRawRankingString()`.

#### The `Ranking` value object

A ranking can be built, validated and rendered on its own through the `Ranking`
class — the same abstraction `VoteLine` uses internally:

```typescript
import { Ranking, VoteLine } from '@condorcet.vote/cef-writer';

const ranking = new Ranking([['Alice'], ['Bob', 'Charlie']]); // [] => /EMPTY_RANKING/
Ranking.fromString('Alice > Bob = Charlie'); // or parse a ranking-only string

ranking.ranks; // [['Alice'], ['Bob', 'Charlie']]
ranking.format(); // "Alice > Bob = Charlie"  (relaxed flavor)
ranking.format(false); // "Alice>Bob=Charlie"   (compact flavor)
String(ranking); // same as format()

VoteLine.fromRanking(ranking, { weight: 7 });
```

`Ranking` is immutable and self-validating: reserved characters, empty ranks and
duplicate candidates throw a `CefFormatException` at construction time.
`Ranking.fromString()` accepts only a ranking — every reserved character, the
`||` tag separator and line breaks are rejected.

#### Verbatim ranking — `VoteLine.fromRawRankingString()`

When you already have a ranking as text and want it written verbatim (its exact
spacing preserved, no re-rendering), build the ballot with
`fromRawRankingString()`. It validates the ranking string with the same rules as
`Ranking.fromString()` but skips parsing it — the string is stored as-is and
`voteLine.ranking` is therefore `null`:

```typescript
const line = VoteLine.fromRawRankingString('Alice>Bob=Charlie', { weight: 7 });
line.format(true); // "Alice>Bob=Charlie ^7"  (ranking kept verbatim)
line.ranking; // null
```

Only the library-built companions (the `||` tag separator, `^weight`,
`*quantifier`) follow `autoFormat`; the ranking itself is never reformatted.
This is the engine behind `Cef.addRawVote()`.

#### From a raw string — `VoteLine.fromString()`

Parse a full CEF vote-line string into a `VoteLine` instance. Every component is
optional except the ranking; both the relaxed (`A > B ^7 * 2`) and the compact
(`A>B^7*2`) spacing flavors are accepted, plus the `/EMPTY_RANKING/` sentinel.

```typescript
cef.addVote(VoteLine.fromString('voter@example.com || Alice > Bob ^7 * 3 # late ballot'));
```

Throws `CefFormatException` on any malformed component.

#### Pre-validated raw lines — `Cef.addRawVoteLine()`

When you already have ballots as text and want the fastest write path,
`addRawVoteLine()` skips the `VoteLine` allocation while still enforcing the full
CEF format:

```typescript
cef.addRawVoteLine('Alice > Bob = Charlie ^7 * 8');
```

It strips one trailing line terminator (`\r\n`, `\n`, `\r`), trims, rejects
empty / multi-line / leading-`#` inputs, then runs `VoteLine.assertValidString()`
for the same deep validation as `fromString()`. The `autoFormat` flag is not
applied — what you pass is what gets written.

#### Strict, ranking-only raw votes — `Cef.addRawVote()`

`addRawVoteLine()` is deliberately permissive: because it accepts a whole vote
line, the caller can embed tags, a weight, a quantifier or an inline comment
directly in the text. When the ranking comes from an untrusted source and you
want a hard guarantee that it cannot smuggle any of that in, use the strict
sibling `addRawVote()`:

```typescript
cef.addRawVote('Alice > Bob = Charlie', {
  quantifier: 8,
  weight: 7,
  tags: ['voter@example.com'],
});
// "voter@example.com || Alice > Bob = Charlie ^7 * 8"
```

`vote` may contain only a ranking — candidate names joined by `>` and `=`, or
the `/EMPTY_RANKING/` sentinel. Any line break, the `||` tag separator, and every
reserved character (`^`, `*`, `#`, `;`, `,`, `/`) is rejected, so the string can
never inject a weight, quantifier, tag, inline comment or a second vote. Those
companions are supplied exclusively through the typed options:

```typescript
cef.addRawVote(
  vote: string,
  options?: {
    quantifier?: number | null;
    weight?: number | null;
    tags?: readonly string[] | null;
  },
): Cef
```

`weight` and `quantifier` are nullable and default to `null`, in which case they
are omitted from the output; when provided they must be strictly positive
integers. Just like `addRawVoteLine()`, the ranking string is written verbatim —
its original spacing is preserved and `autoFormat` does not reformat it. The
`autoFormat` flag still governs the layout of the library-built companions.
Throws `CefFormatException` on any malformed input.

#### Validation-only — `VoteLine.assertValidString()`

If you want to validate a vote-line string without allocating a `VoteLine` (e.g.
to pre-flight user input before queueing it elsewhere), call the static
`assertValidString()` — same pipeline as `fromString()`, no object returned,
throws `CefFormatException` on any violation.

### Comments and blank lines

```typescript
cef.addComment(new CommentLine('section divider'));
cef.addCommentLine('shortcut — builds the CommentLine for you');
cef.addEmptyLine();
```

Inline comments attached to vote lines live on `VoteLine.inlineComment`. The CEF
spec forbids inline comments on parameter lines, so the parameter classes
intentionally do not expose one.

## Errors

Two top-level hierarchies, each for a different layer.

### Format & input violations — `CefFormatException`

Base class for every specification or input violation. Catch this one to handle
any format-related failure uniformly; catch a specific subclass to branch on a
kind of violation. Each message names the offending field and the rule that was
broken.

| Subclass | Cause |
| --- | --- |
| `InvalidUtf8Exception` | A string carrying an unpaired UTF-16 surrogate, which cannot be encoded to well-formed UTF-8 (the TypeScript analog of "non-UTF-8 bytes"). |
| `ReservedCharacterException` | One of the spec-reserved characters (`> = ; , # / * ^`), a `:` in a custom parameter name, `||` inside a tag, or a leading `#` on a raw vote line. |
| `InvalidValueException` | Empty required string, embedded line break, null byte, non-positive weight / quantifier, empty `#/Candidates:` or `#/Voting Methods:` list, or empty rank inside a ranking. |
| `DuplicateCandidateException` | Same candidate label appearing twice in `#/Candidates:` or anywhere inside a ranking (including across tied groups). |
| `InvalidWriterStateException` | `Cef` constructed with neither a file nor a string target (or with both); parameter added after the first vote; vote-line string parsed without a ranking. |

All subclasses extend `CefFormatException`.

### I/O failures — `CefWriteException`

Thrown when writing to the underlying target (file or string buffer) fails —
typically a closed handle, a read-only file, or a full disk. Distinct from
`CefFormatException` because the cause is I/O, not your input. When the write
target throws, the original error is preserved on the `cause` property.

> [!NOTE]
> **Differences from the PHP original.** TypeScript strings are sequences of
> UTF-16 code units, so "invalid UTF-8" is detected as an ill-formed string
> carrying an unpaired surrogate. The "string passed by reference" target is
> modeled as the `StringBuffer` value object, and the named-argument
> constructors (`fromRanking`, `addRawVote`, …) take an options object instead.
> The public class names, methods, validation rules and output are otherwise
> identical to the source library.

## Development

This repository uses [Bun](https://bun.sh) for development.

```bash
bun install
bun run dev          # TypeScript watch mode
bun run build        # Compile TypeScript to dist/
bun run lint         # ESLint
bun run lint:fix     # ESLint with auto-fix
bun run format       # Prettier
bun run type-check   # tsc --noEmit
bun test             # Run the test suite
```

The library is organized to mirror the PHP source architecture:

```
src/
├── index.ts                 # Public API barrel
├── Cef.ts                   # Streaming writer
├── CefFormat.ts             # Internal validation helpers (@internal)
├── Ranking.ts               # Ranking value object
├── VoteLine.ts              # Ballot value object
├── CommentLine.ts           # Standalone comment line
├── Exception/               # CefFormatException hierarchy + CefWriteException
└── Parameter/               # ParameterInterface, StandardParameter + typed parameters
```

## Contributing

Contributions are welcome! Please read our [contributing guide](CONTRIBUTING.md) for details.

## License

MIT — see [LICENSE](LICENSE).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes in each version.
