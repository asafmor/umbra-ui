# Changesets

Every change that users of the library will notice needs a changeset: run `npm run changeset`, pick the
bump (patch, minor or major) and write one line for the changelog. Write it for a user of the library:
what they can now do, or what changed for them.

`npm run version` turns the pending changesets into a version bump and `CHANGELOG.md`. The release steps
are in [`docs/releasing.md`](../docs/releasing.md).
