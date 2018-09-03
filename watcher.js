/**
 * A file watcher that will re-run a script when specified files change.
 *
 * Usage:
 *   watcher <file_to_run> [<watch_file_or_dir>, [<watch_file_or_dir>, ...]]
 *
 * Example:
 *   # Start index.js, and watch index.js, server.js, and the lib folder for changes.
 *   #
 *   $ node watcher index.js server.js lib
 *
 * Author: James Abney
 * Date: 2018-Sep-03
 */
const cp = require('child_process')
const fs = require('fs')

const RESTART_DELAY_MS = 2000

// https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
const con = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

/**
 * Spawn and return the process.
 *
 * @param {string} startFile
 */
function spawn(startFile) {
  const process = cp.spawn('node', [startFile])

  // Bind to output streams and color the console messages.
  process.stdout.on('data', (b) => {
    console.log(con.green, con.bright, b.toString(), con.reset)
  })
  process.stderr.on('data', (b) => {
    console.error(con.red, con.bright, b.toString(), con.reset)
  })

  return process
}

/**
 * Kill and restart the process.
 *
 * @param {string} startFile
 * @param {cp.ChildProcess} process
 */
function restart(startFile, process) {
  return new Promise((resolve, reject) => {
    console.log(con.yellow, 'Restarting...', con.reset, '\n')

    process.kill()

    setTimeout(async () => {
      resolve(spawn(startFile))
    }, RESTART_DELAY_MS)
  })
}

/**
 * Start the process and watch files.
 *
 * @param {string[]} paths
 */
function start(startFile, paths) {
  // Remove leading './' if any.
  const reFilename = /^(?:\.\/)?(.+?)$/
  const file = startFile.replace(reFilename, '$1')

  console.log(
    con.yellow,
    `Starting ${file}, watching ${paths.join(', ')} ...`,
    con.reset,
    '\n')

  // Start the process.
  let process = spawn(startFile)

  // File watch options.
  const options = {
    recursive: true
  }

  // Track when we're actively restarting.
  let restarting = false

  // Watch each path.
  paths.forEach((path) => {
    fs.watch(path, options, async (event, filename) => {
      // Block repeat watch events that happen in quick succession.
      if (!restarting) {
        // Lock
        restarting = true

        // Restart the process.
        process = await restart(startFile, process)

        // Unlock
        restarting = false
      }
    })
  })
}

// Get the js file to run.
const file = process.argv[2]

// Get the paths to watch.
const paths = process.argv.slice(2)

// Start and watch.
start(file, paths)
