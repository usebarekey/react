# AGENTS.md — @barekey/react

## Package Manager

- This repo uses Bun.
- Use `bun install` for dependency changes.
- Use `bun run <script>` for project scripts.
- Use `bun test` for tests.
- Do not use `npm` or commit `package-lock.json`.

## Releases

### React package update ritual

- If React package work changes the public API, runtime behavior, browser leak guard, package exports, or published artifacts, bump `package.json` before merging to `master`.
- Use semantic versioning for the React package bump: `patch` for backward-compatible fixes, `minor` for backward-compatible features, `major` for breaking changes.
- Keep the release commit on `master` self-contained: include the code changes, tests, docs, and the version bump together.
- Before pushing or publishing, run:
  - `bun run typecheck`
  - `bun run test`
  - `bun run build`
- Keep the `@barekey/sdk` dependency aligned with the SDK release this package expects. If React depends on a newly released SDK feature or fix, update `@barekey/sdk` in `package.json`, run `bun install`, and commit the resulting `bun.lock` changes too.

### SDK handoff from React

- If work includes merging changes to `/home/sander/barekey/sdk`, make sure the SDK repo is version-bumped first whenever its surface, generated types, runtime behavior, or published artifacts changed.
- After that SDK merge, update the React dependency to the new SDK version if this package consumes the changed behavior.
