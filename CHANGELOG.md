# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-11

### Added
- Full TypeScript port of the PHP library `CondorcetVote/CEF-Writer`.
- `Cef` streaming writer with file (`string` path / `WriteTarget`) and
  `StringBuffer` targets, `autoFormat` flag, and `addParameter`, `addVote`,
  `addRawVote`, `addRawVoteLine`, `addComment`, `addCommentLine`, `addEmptyLine`.
- `Ranking` and `VoteLine` value objects with `fromRanking`, `fromString`,
  `fromRawRankingString`, and `assertValidString` constructors.
- `CommentLine` and the typed parameter classes (`CandidatesParameter`,
  `CustomParameter`, `ImplicitRankingParameter`, `NumberOfSeatsParameter`,
  `VotingMethodsParameter`, `WeightAllowedParameter`) plus the
  `StandardParameter` enum.
- Exception hierarchy: `CefFormatException` (with `InvalidUtf8Exception`,
  `ReservedCharacterException`, `InvalidValueException`,
  `DuplicateCandidateException`, `InvalidWriterStateException`) and
  `CefWriteException`.
- Full test suite (345 tests) ported from the source library, run with `bun test`.
- TypeScript configuration, ESLint and Prettier setup.

### Changed
- Set the TypeScript `target`/`lib` to ES2024.

### Deprecated

### Removed

### Fixed
- Corrected an invalid ESLint rule name (`explicit-function-return-types`).

### Security
- Reserved-character, line-break, null-byte and ill-formed-UTF-16 validation on
  every user-supplied value; strict `addRawVote()` blocks injection of weights,
  quantifiers, tags, inline comments or second votes from untrusted rankings.
