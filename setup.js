#!/usr/bin/env node
/* eslint-disable no-console */
const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const projectRoot = __dirname
const composeFile = path.join(projectRoot, 'docker-compose.yml')

const command = (process.argv[2] || 'up').toLowerCase()
const rawArgs = process.argv.slice(3)

const parseArgs = () => {
  const options = {
    build: true,
    forceRecreate: false,
    pull: false,
    follow: false,
    services: [],
    passthrough: [],
  }

  for (const arg of rawArgs) {
    if (!arg.startsWith('--')) {
      options.services.push(arg)
      continue
    }

    switch (arg) {
      case '--no-build':
        options.build = false
        break
      case '--force-recreate':
        options.forceRecreate = true
        break
      case '--pull':
        options.pull = true
        break
      case '--follow':
        options.follow = true
        options.passthrough.push(arg)
        break
      default:
        options.passthrough.push(arg)
        break
    }
  }

  return options
}

const ensureComposeFile = () => {
  if (!fs.existsSync(composeFile)) {
    throw new Error('docker-compose.yml not found. Please run this script from the project root.')
  }
}

const detectComposeCommand = () => {
  const pluginCheck = spawnSync('docker', ['compose', 'version'], {
    stdio: 'ignore',
  })

  if (pluginCheck.status === 0) {
    return { bin: 'docker', args: ['compose'] }
  }

  const legacyCheck = spawnSync('docker-compose', ['version'], {
    stdio: 'ignore',
  })

  if (legacyCheck.status === 0) {
    return { bin: 'docker-compose', args: [] }
  }

  throw new Error(
    'Docker Compose is not available. Install Docker Desktop (which includes Docker Compose v2) or the docker-compose CLI.'
  )
}

const checkDocker = () => {
  const versionCheck = spawnSync('docker', ['version'], { stdio: 'ignore' })
  if (versionCheck.status !== 0) {
    throw new Error('Docker is not available in PATH. Please install Docker Desktop or the Docker Engine.')
  }
}

const spawnCompose = async (composeArgs) => {
  const { bin, args } = detectComposeCommand()
  return new Promise((resolve, reject) => {
    const child = spawn(bin, [...args, ...composeArgs], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })
  })
}

const up = async (options) => {
  const composeArgs = ['up', '-d']

  if (options.build) {
    composeArgs.push('--build')
  }

  if (options.forceRecreate) {
    composeArgs.push('--force-recreate')
  }

  if (options.pull) {
    composeArgs.push('--pull', 'always')
  }

  composeArgs.push(...options.services)

  await spawnCompose(composeArgs)
  console.log('\nStack is running on http://localhost:5555')
}

const down = async (options) => {
  const composeArgs = ['down', '--remove-orphans']
  if (options.forceRecreate) {
    composeArgs.push('--volumes')
  }
  await spawnCompose(composeArgs)
}

const logs = async (options) => {
  const composeArgs = ['logs']
  if (options.follow) {
    composeArgs.push('-f')
  }
  composeArgs.push(...options.passthrough.filter((flag) => flag !== '--follow' && flag !== '--tail'))
  composeArgs.push(...options.services)
  await spawnCompose(composeArgs)
}

const ps = async (options) => {
  const composeArgs = ['ps', ...options.services]
  await spawnCompose(composeArgs)
}

const restart = async (options) => {
  await spawnCompose(['restart', ...options.services])
}

const help = () => {
  console.log(`Usage: node setup.js <command> [options] [services]

Commands:
  up           Build (unless --no-build) and start the stack in detached mode
  down         Stop the stack (add --force-recreate to also remove volumes)
  logs         Show container logs (pass --follow to stream)
  ps           List service status
  restart      Restart one or more services
  help         Show this message

Examples:
  node setup.js up
  node setup.js up --no-build
  node setup.js logs --follow backend
  node setup.js down --force-recreate
`)
}

const execute = async () => {
  try {
    ensureComposeFile()
    checkDocker()
    const options = parseArgs()

    switch (command) {
      case 'up':
        await up(options)
        break
      case 'down':
        await down(options)
        break
      case 'logs':
        await logs(options)
        break
      case 'ps':
      case 'status':
        await ps(options)
        break
      case 'restart':
        await restart(options)
        break
      case 'help':
      case '--help':
      case '-h':
        help()
        break
      default:
        console.error(`Unknown command: ${command}\n`)
        help()
        process.exitCode = 1
    }
  } catch (error) {
    console.error(`\nSetup failed: ${error.message}`)
    process.exitCode = 1
  }
}

execute()
