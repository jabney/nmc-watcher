# nmc-watcher
A basic process runner/restarter for node, with no external dependencies, intended to automatically restart a server when a source file changes.

## Usage

```
watcher <file_to_run> [<watch_file_or_dir>, [<watch_file_or_dir>, ...]]
```

### Example

```bash
# Start index.js, and watch index.js, server.js, and the lib folder for changes.
#
$ node watcher index.js server.js lib
```

## Notes
Developed on node `8.9.2` and uses `async/await`, so you'll need at least a node version that supports `async/await`.

## Issues
This script uses `fs.watch` which receives multiple change events when a file changes. Restarting waits 2 seconds after killing the process, but sometimes the change events are more than 2 seconds apart so changing a file will occasionally cause duplicate restarts. This shouldn't be much of a problem in practice.
