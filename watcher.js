const cp = require('child_process')
const fs = require('fs')

/**
 * Spawn and return the process.
 *
 * @param {string} startFile
 */
function spawn(startFile) {
  const process = cp.spawn('node', [startFile])

  process.stdout.on('data', (b) => console.log(b.toString()))
  process.stderr.on('data', (b) => console.error(b.toString()))

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
    console.log('Restarting...')

    process.kill()

    setTimeout(async () => {
      resolve(spawn(startFile))
    }, 1000)
  })
}

/**
 * Start the process and watch files.
 *
 * @param {string[]} paths
 */
function start(startFile, paths) {
  const reFilename = /^(?:\.\/)?(.+?)(?:\.js)?$/

  console.log(`Starting ${startFile.replace(reFilename, '$1')} ...`)

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

const file = process.argv[2]
const paths = process.argv.slice(2)

// Start and watch.
start(file, paths)
