# Contributing to Orthanc Client SDK

Thanks for your interest in contributing. This document explains how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies with `npm install`
4. Create a branch for your changes

## Development

### Running tests

```bash
npm test
```

### Running the linter

```bash
npm run lint
```

### Building the project

```bash
npm run build
```

### Running examples

Examples are in the `examples/` folder. To run one:

```bash
npx ts-node examples/local-development.ts
```

## Making Changes

### Code Style

We use TypeScript with strict mode enabled. Follow these guidelines:

1. Use meaningful variable and function names
2. Add JSDoc comments for public APIs
3. Keep functions small and focused
4. Write tests for new functionality

### Commit Messages

Write clear commit messages that explain what changed and why:

```
Add batch query support

Allows multiple queries to be sent in a single request,
reducing network overhead for applications that need
to query multiple users at once.
```

### Pull Requests

1. Create a branch from `main`
2. Make your changes
3. Add or update tests as needed
4. Run `npm test` and `npm run lint`
5. Push your branch and open a pull request
6. Fill out the pull request template

### What to Include

A good pull request includes:

1. A clear description of the change
2. Tests that cover the new functionality
3. Updated documentation if needed
4. A note in CHANGELOG.md under Unreleased

## Types of Contributions

### Bug Reports

If you find a bug, open an issue with:

1. A clear title
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Your environment (Node version, OS, etc.)

### Feature Requests

For new features, open an issue describing:

1. The problem you're trying to solve
2. Your proposed solution
3. Any alternatives you considered

### Documentation

Documentation improvements are always welcome. This includes:

1. README updates
2. Code comments
3. Example code
4. Protocol documentation

### Code

Code contributions should:

1. Follow the existing code style
2. Include tests
3. Not break existing functionality
4. Be focused on a single change

## Project Structure

```
client-sdk/
├── src/
│   ├── index.ts        # Main exports
│   ├── client.ts       # OrthancsClient class
│   ├── local.ts        # LocalClient for testing
│   ├── types.ts        # Type definitions
│   ├── errors.ts       # Error classes
│   ├── cache.ts        # Query cache
│   └── __tests__/      # Test files
├── docs/
│   └── protocol.md     # Protocol specification
├── examples/           # Example code
└── .github/
    └── workflows/      # CI/CD configuration
```

## Testing

We use Vitest for testing. Tests are in `src/__tests__/`.

### Writing Tests

1. Create a file named `*.test.ts` in `src/__tests__/`
2. Use `describe` and `it` blocks to organize tests
3. Test both success and error cases
4. Mock external dependencies when needed

Example:

```typescript
import { describe, it, expect } from "vitest";
import { LocalClient } from "../local";

describe("LocalClient", () => {
  it("should query memories", async () => {
    const client = new LocalClient();
    await client.syncText("user-1", "User likes coffee");

    const result = await client.query("user-1", "coffee");

    expect(result.count).toBeGreaterThan(0);
  });
});
```

## Questions

If you have questions, open an issue or reach out on Discord.

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 license.
