# Contributing to MokaParse

Thank you for your interest in contributing to MokaParse! This document establishes the ground rules and workflow for all contributors.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Code](#submitting-code)
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [License Agreement](#license-agreement)

---

## Code of Conduct

All participants are expected to be respectful and constructive. Harassment, discriminatory language, or personal attacks will not be tolerated. When in doubt, be kind.

---

## How Can I Contribute?

### Reporting Bugs

Before opening an issue, search existing issues to avoid duplicates.

When opening a bug report, please include:

- **MokaParse version** (or commit hash if built from source).
- **Operating system** and version.
- **Steps to reproduce** the issue.
- **Expected behavior** vs. **actual behavior**.
- Any **error messages** or stack traces.
- If the bug involves a specific book file, describe the file format (EPUB/PDF) and approximate size.

> **Do not attach copyrighted book files to issues.**

### Suggesting Features

Open a GitHub Issue with the label `enhancement`. Describe:

- The **problem** you are trying to solve.
- Your **proposed solution** or approach.
- Any **alternatives** you considered.

### Submitting Code

1. Fork the repository and create your branch from `main`.
2. Make your changes following the [Coding Standards](#coding-standards) below.
3. Run all tests and make sure they pass.
4. Open a Pull Request (PR) against `main`.

---

## Development Setup

**Requirements:**
- Rust (latest stable via `rustup`)
- Node.js v18+, pnpm
- Tauri system dependencies for your platform

```bash
# Clone your fork
git clone https://github.com/<your-username>/MokaParse.git
cd MokaParse

# Build and test the Rust workspace
cargo build
cargo test

# Run the GUI in dev mode
cd crates/app
pnpm install
pnpm tauri dev
```

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, releasable code. Always deployable. |
| `GUI` | Frontend and Tauri development. |
| `feature/<name>` | New features or major additions. Branch from `main`. |
| `fix/<name>` | Bug fixes. Branch from `main`. |
| `docs/<name>` | Documentation-only changes. |

**Never commit directly to `main`.** All changes must come through a Pull Request.

---

## Commit Message Convention

MokaParse uses **Conventional Commits**:

```
<type>(<scope>): <short description>
```

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build process, dependency updates, tooling |

**Scopes** map to crates or areas: `core`, `parsers`, `cli`, `gui`, `db`.

**Examples:**
```
feat(core): add hiragana frequency analysis
fix(parsers): handle PDF files with no text layer
docs(gui): add screenshots to README
refactor(db): extract connection helper to reduce duplication
```

Keep the description **short (≤72 chars)** and written in the **imperative mood** ("add", "fix", "remove" — not "added" or "adding").

---

## Pull Request Process

1. **Keep PRs focused.** One feature or fix per PR. Avoid mixing unrelated changes.
2. **Write a clear description.** Explain *what* you changed and *why*.
3. **Reference related issues.** Use `Closes #<issue>` or `Relates to #<issue>` in your PR description.
4. **All tests must pass.** Run `cargo test` before opening a PR.
5. **No warnings.** Rust compiler warnings (`cargo clippy`) must be resolved.
6. **At least one approval** from a maintainer is required before merging.
7. **Squash trivial fixup commits** before requesting review (e.g., merge "Fix typo" commits into the main commit).

### PR Title Format

Follow the same Conventional Commits format as individual commits:

```
feat(gui): add furigana display to Kanji grid
fix(core): correctly handle surrogate pairs in Unicode input
```

---

## Coding Standards

### Rust

- Follow standard Rust idioms (prefer `?` over `.unwrap()` in production code).
- All public API items must have doc comments (`///`).
- Use `anyhow` for error propagation in binary crates and application code.
- Keep pure logic in `crates/core` free of I/O — no file system access, no network calls.
- New features in `core` or `parsers` **must include unit tests**.

```bash
# Lint and format before committing
cargo fmt --all
cargo clippy --all-targets -- -D warnings
cargo test
```

### TypeScript / React (GUI)

- Use **functional components** with hooks — no class components.
- Keep component logic lean: data fetching and state should be colocated in the page component; pure UI should be in separate components.
- Prefer **CSS custom properties** (`var(--token)`) over hard-coded color values.
- All Tauri `invoke()` calls must include a typed generic (`invoke<ReturnType>(...)`).
- Do not use `any` unless unavoidable; add a comment explaining why.

---

## License Agreement

By contributing to MokaParse, you agree that your contributions will be licensed under the same **MIT License** that covers this project. You confirm that you have the right to submit the code you are contributing.

---

*If you have any questions, open a Discussion on GitHub rather than an Issue.*
