# Changesets

This directory stores release notes for versioning and publishing packages in this monorepo.

## Workflow

1. Run `pnpm changeset` after finishing a user-facing change.
2. Commit the generated markdown file in this directory with your PR.
3. Run `pnpm version-packages` on the release branch to update package versions and `CHANGELOG.md`.
4. Run `pnpm release` to build and publish packages.
