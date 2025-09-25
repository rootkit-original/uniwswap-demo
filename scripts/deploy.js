#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('path')
const fs = require('fs')
const fsp = require('fs/promises')
const os = require('os')
const readline = require('readline')
const { spawn } = require('child_process')
const { Client } = require('ssh2')
const tar = require('tar')

const ROOT_DIR = path.resolve(__dirname, '..')
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend')
const BACKEND_DIR = path.join(ROOT_DIR, 'backend')

const REMOTE_PATHS = {
	backendTar: '/tmp/uniwswap-backend.tar.gz',
	frontendTar: '/tmp/uniwswap-frontend.tar.gz',
	backendEnv: '/tmp/uniwswap-backend.env',
	systemdService: '/tmp/uniwswap-backend.service',
	nginxSite: '/tmp/uniwswap.conf'
}

const REMOTE_TARGETS = {
	backendDir: '/opt/uniwswap/backend',
	stateDir: '/opt/uniwswap',
	frontendDir: '/var/www/uniwswap',
	nginxAvailable: '/etc/nginx/sites-available/uniwswap.conf',
	nginxEnabled: '/etc/nginx/sites-enabled/uniwswap.conf',
	systemdService: '/etc/systemd/system/uniwswap-backend.service'
}

const DEFAULTS = {
	port: 22,
	backendPort: 3331,
	nodeEnv: 'production',
	serverName: '_',
	readyTimeout: 45000
}

const emoji = {
	step: '➡️ ',
	success: '✅',
	warn: '⚠️ ',
	info: 'ℹ️ ',
	error: '❌'
}

const isTruthy = (value) => {
	if (typeof value === 'boolean') return value
	if (typeof value === 'number') return Number.isFinite(value) && value !== 0
	if (typeof value === 'string') return /^(1|true|y|yes|on)$/i.test(value.trim())
	return false
}

const parseArgs = (argv) => {
	const options = {
		dryRun: false,
		skipBuild: false,
		skipFrontend: false,
		skipBackend: false,
		skipUpload: false,
		nonInteractive: isTruthy(process.env.DEPLOY_NON_INTERACTIVE) || isTruthy(process.env.CI)
	}

	for (const arg of argv) {
		switch (arg) {
			case '--dry-run':
				options.dryRun = true
				break
			case '--skip-build':
				options.skipBuild = true
				break
			case '--skip-frontend':
				options.skipFrontend = true
				break
			case '--skip-backend':
				options.skipBackend = true
				break
			case '--skip-upload':
				options.skipUpload = true
				break
			case '--non-interactive':
				options.nonInteractive = true
				break
			default:
				throw new Error(`Unknown argument: ${arg}`)
		}
	}

	return options
}

const createPrompter = () => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		terminal: true
	})

	const askOnce = (promptMessage, hidden) => new Promise((resolve) => {
		if (!hidden) {
			rl.question(promptMessage, resolve)
			return
		}

		const originalWrite = rl._writeToOutput
		rl._writeToOutput = function (stringToWrite) {
			if (stringToWrite.startsWith(promptMessage)) {
				originalWrite.call(rl, promptMessage)
				return
			}

			if (stringToWrite === '\n' || stringToWrite === '\r\n') {
				originalWrite.call(rl, stringToWrite)
			}
		}

		rl.question(promptMessage, (answer) => {
			rl.output.write('\n')
			rl._writeToOutput = originalWrite
			resolve(answer)
		})
	})

	const ask = async (message, options = {}) => {
		const {
			defaultValue,
			hidden = false,
			required = false,
			validate,
			transformer
		} = options

		const hasDefault = defaultValue !== undefined && defaultValue !== null && `${defaultValue}` !== ''
		const displayDefault = !hidden && hasDefault ? ` [${defaultValue}]` : ''
		const promptMessage = `${message}${displayDefault}: `

		while (true) {
			const answer = await askOnce(promptMessage, hidden)
			const processedAnswer = hidden ? answer : answer.trim()
			const rawValue = processedAnswer === '' ? (hasDefault ? defaultValue : '') : processedAnswer

			if (required && (rawValue === undefined || rawValue === null || rawValue === '')) {
				console.log(`${emoji.error}Este campo é obrigatório.`)
				continue
			}

			if (validate) {
				const error = validate(rawValue)
				if (error) {
					console.log(`${emoji.error}${error}`)
					continue
				}
			}

			if (transformer) {
				try {
					return transformer(rawValue)
				} catch (error) {
					console.log(`${emoji.error}${error.message || error}`)
					continue
				}
			}

			return rawValue
		}
	}

	const close = () => rl.close()

	return { ask, close }
}

const isAffirmative = (value) => /^y(es)?$/i.test(String(value ?? '').trim())

const parseInteger = (value, fieldName, options = {}) => {
	if (value === undefined || value === null || value === '') {
		throw new Error(`${fieldName} deve ser informado.`)
	}

	const number = Number(value)

	if (!Number.isFinite(number) || !Number.isInteger(number)) {
		throw new Error(`${fieldName} deve ser um número inteiro.`)
	}

	if (typeof options.min === 'number' && number < options.min) {
		throw new Error(`${fieldName} deve ser maior ou igual a ${options.min}.`)
	}

	return number
}

const loadConfigFromEnv = async (options) => {
	const readEnv = (name) => {
		const value = process.env[name]
		if (value === undefined || value === null) return ''
		return String(value).trim()
	}

	const requireEnv = (name) => {
		const value = readEnv(name)
		if (!value) {
			throw new Error(`A variável de ambiente ${name} deve ser definida quando o modo não interativo está habilitado.`)
		}
		return value
	}

	console.log(`${emoji.info}Carregando configuração via variáveis de ambiente (modo não interativo).`)

	const host = requireEnv('DEPLOY_HOST')
	const username = requireEnv('DEPLOY_USER')
	const port = parseInteger(readEnv('DEPLOY_PORT') || String(DEFAULTS.port), 'Porta SSH', { min: 1 })
	const backendPort = parseInteger(readEnv('DEPLOY_BACKEND_PORT') || String(DEFAULTS.backendPort), 'Porta do backend', { min: 1 })
	const readyTimeout = parseInteger(readEnv('DEPLOY_READY_TIMEOUT') || String(DEFAULTS.readyTimeout), 'Timeout de conexão SSH', { min: 1 })

	let password = readEnv('DEPLOY_PASSWORD') || null
	let privateKeyPath = readEnv('DEPLOY_PRIVATE_KEY') || null
	let privateKey = null
	const passphrase = readEnv('DEPLOY_PASSPHRASE') || null

	if (privateKeyPath) {
		const resolved = path.isAbsolute(privateKeyPath)
			? privateKeyPath
			: path.join(ROOT_DIR, privateKeyPath)

		try {
			privateKey = await fsp.readFile(resolved, 'utf8')
		} catch (error) {
			throw new Error(`Não foi possível ler a chave privada (${resolved}): ${error.message}`)
		}
	} else {
		privateKeyPath = null
	}

	if (!privateKey && (!password || password.length === 0)) {
		throw new Error('Forneça DEPLOY_PRIVATE_KEY (caminho da chave) ou DEPLOY_PASSWORD para autenticação em modo não interativo.')
	}

	let sudoPassword = readEnv('DEPLOY_SUDO_PASSWORD') || password
	if (!sudoPassword) {
		throw new Error('DEPLOY_SUDO_PASSWORD deve ser informado quando o modo não interativo está habilitado.')
	}

	const nodeEnv = readEnv('DEPLOY_NODE_ENV') || DEFAULTS.nodeEnv
	const serverName = readEnv('DEPLOY_SERVER_NAME') || DEFAULTS.serverName
	const serviceUser = readEnv('DEPLOY_SERVICE_USER') || username
	const mongoUri = readEnv('DEPLOY_MONGODB_URI') || ''
	const frontendUrl = readEnv('DEPLOY_FRONTEND_URL') || ''

	if (!mongoUri) {
		console.log(`${emoji.warn}MongoDB URI não informado. O backend usará mongodb://localhost:27017/uniwswap.`)
	}

	if (!frontendUrl) {
		console.log(`${emoji.info}Frontend URL não informado. CORS usará os valores padrão.`)
	}

	if (options.dryRun) {
		console.log(`${emoji.info}Running in dry-run mode. Remote side-effects will be skipped.`)
	}

	return {
		host,
		username,
		password: password || null,
		sudoPassword,
		port,
		readyTimeout,
		backendPort,
		mongoUri,
		frontendUrl,
		nodeEnv,
		serverName,
		serviceUser,
		privateKeyPath,
		privateKey,
		passphrase
	}
}

const loadConfig = async (options) => {
	if (options.nonInteractive) {
		return loadConfigFromEnv(options)
	}

	const prompter = createPrompter()

	try {
		const host = (await prompter.ask('Servidor remoto (host)', {
			defaultValue: process.env.DEPLOY_HOST,
			required: true
		})).trim()

		const port = await prompter.ask('Porta SSH', {
			defaultValue: process.env.DEPLOY_PORT || String(DEFAULTS.port),
			required: true,
			transformer: (value) => parseInteger(value, 'Porta SSH', { min: 1 })
		})

		const username = (await prompter.ask('Usuário SSH', {
			defaultValue: process.env.DEPLOY_USER,
			required: true
		})).trim()

		const usePrivateKey = isAffirmative(await prompter.ask('Usar chave privada SSH? (y/N)', {
			defaultValue: process.env.DEPLOY_PRIVATE_KEY ? 'y' : 'n'
		}))

		let password = null
		let privateKeyPath = null
		let privateKey = null
		let passphrase = null

		if (usePrivateKey) {
			while (true) {
				const inputPath = (await prompter.ask('Caminho para a chave privada', {
					defaultValue: process.env.DEPLOY_PRIVATE_KEY,
					required: true
				})).trim()

				const resolved = path.isAbsolute(inputPath)
					? inputPath
					: path.join(ROOT_DIR, inputPath)

				try {
					privateKey = await fsp.readFile(resolved, 'utf8')
					privateKeyPath = inputPath
					break
				} catch (error) {
					console.log(`${emoji.error}Não foi possível ler a chave privada: ${error.message}`)
				}
			}

			const passphraseInput = await prompter.ask('Passphrase da chave (opcional)', {
				defaultValue: process.env.DEPLOY_PASSPHRASE,
				hidden: true
			})
			passphrase = passphraseInput ? passphraseInput : null
		} else {
			password = await prompter.ask('Senha SSH', {
				defaultValue: process.env.DEPLOY_PASSWORD,
				hidden: true,
				required: true
			})
		}

		let sudoPassword = await prompter.ask('Senha sudo (Enter para reutilizar a senha SSH ou definir manualmente)', {
			defaultValue: process.env.DEPLOY_SUDO_PASSWORD,
			hidden: true
		})

		if (!sudoPassword && password) {
			sudoPassword = password
		}

		if (!sudoPassword) {
			sudoPassword = await prompter.ask('Senha sudo (obrigatória)', {
				hidden: true,
				required: true
			})
		}

		const backendPort = await prompter.ask('Porta do backend', {
			defaultValue: process.env.DEPLOY_BACKEND_PORT || String(DEFAULTS.backendPort),
			required: true,
			transformer: (value) => parseInteger(value, 'Porta do backend', { min: 1 })
		})

		const readyTimeout = await prompter.ask('Timeout de conexão SSH (ms)', {
			defaultValue: process.env.DEPLOY_READY_TIMEOUT || String(DEFAULTS.readyTimeout),
			required: true,
			transformer: (value) => parseInteger(value, 'Timeout de conexão SSH', { min: 1 })
		})

		const nodeEnv = (await prompter.ask('NODE_ENV', {
			defaultValue: process.env.DEPLOY_NODE_ENV || DEFAULTS.nodeEnv,
			required: true
		})).trim() || DEFAULTS.nodeEnv

		const serverName = (await prompter.ask('Server name (nginx)', {
			defaultValue: process.env.DEPLOY_SERVER_NAME || DEFAULTS.serverName,
			required: true
		})).trim() || DEFAULTS.serverName

		const serviceUser = (await prompter.ask('Usuário do serviço (systemd)', {
			defaultValue: process.env.DEPLOY_SERVICE_USER || username,
			required: true
		})).trim()

		const mongoUriInput = await prompter.ask('MongoDB URI (opcional)', {
			defaultValue: process.env.DEPLOY_MONGODB_URI
		})
		const frontendUrlInput = await prompter.ask('Frontend URL (opcional)', {
			defaultValue: process.env.DEPLOY_FRONTEND_URL
		})

		const mongoUri = mongoUriInput ? mongoUriInput.trim() : ''
		const frontendUrl = frontendUrlInput ? frontendUrlInput.trim() : ''

		const config = {
			host,
			username,
			password: password || null,
			sudoPassword,
			port,
			readyTimeout,
			backendPort,
			mongoUri,
			frontendUrl,
			nodeEnv,
			serverName,
			serviceUser,
			privateKeyPath,
			privateKey,
			passphrase
		}

		if (!mongoUri) {
			console.log(`${emoji.warn}MongoDB URI não informado. O backend usará mongodb://localhost:27017/uniwswap.`)
		}

		if (!frontendUrl) {
			console.log(`${emoji.info}Frontend URL não informado. CORS usará os valores padrão.`)
		}

		if (options.dryRun) {
			console.log(`${emoji.info}Running in dry-run mode. Remote side-effects will be skipped.`)
		}

		return config
	} finally {
		prompter.close()
	}
}

const runLocalCommand = (command, options = {}) => {
	const { cwd = ROOT_DIR, label = command } = options
	return new Promise((resolve, reject) => {
		console.log(`\n${emoji.step}${label}`)
		const child = spawn(command, {
			cwd,
			env: process.env,
			stdio: 'inherit',
			shell: true
		})

		child.on('close', (code) => {
			if (code === 0) {
				resolve()
			} else {
				reject(new Error(`Command failed (${label}) with exit code ${code}`))
			}
		})
	})
}

const createTarball = async (sourceDir, outputFile, filter) => {
	await tar.c({
		gzip: true,
		cwd: sourceDir,
		file: outputFile,
		portable: true,
		filter
	}, ['.'])
}

const buildFrontend = async (options, tempDir) => {
	if (options.skipFrontend) {
		console.log(`${emoji.info}Skipping frontend packaging as requested.`)
		return null
	}

	const distDir = path.join(FRONTEND_DIR, 'dist')

	if (!options.skipBuild) {
		const installCommand = fs.existsSync(path.join(FRONTEND_DIR, 'package-lock.json')) ? 'npm ci' : 'npm install'
		await runLocalCommand(installCommand, { cwd: FRONTEND_DIR, label: 'Install frontend dependencies' })
		await runLocalCommand('npm run build', { cwd: FRONTEND_DIR, label: 'Build frontend bundle' })
	} else {
		console.log(`${emoji.info}Skipping frontend build but using existing dist/ directory.`)
	}

	if (!fs.existsSync(distDir)) {
		throw new Error('Frontend dist/ directory not found. Run npm run build or remove --skip-build.')
	}

	const archivePath = path.join(tempDir, 'frontend.tar.gz')
	await createTarball(distDir, archivePath)
	console.log(`${emoji.success}Frontend packaged -> ${archivePath}`)
	return archivePath
}

const packageBackend = async (options, tempDir) => {
	if (options.skipBackend) {
		console.log(`${emoji.info}Skipping backend packaging as requested.`)
		return null
	}

	const archivePath = path.join(tempDir, 'backend.tar.gz')
	await createTarball(BACKEND_DIR, archivePath, (filePath) => {
		if (filePath.startsWith('node_modules')) return false
		if (filePath.endsWith('.env')) return false
		return true
	})
	console.log(`${emoji.success}Backend packaged -> ${archivePath}`)
	return archivePath
}

const writeBackendEnvFile = async (config, tempDir) => {
	const envLines = [
		`NODE_ENV=${config.nodeEnv}`,
		`PORT=${config.backendPort}`
	]

	if (config.mongoUri) {
		envLines.push(`MONGODB_URI=${config.mongoUri}`)
	}

	if (config.frontendUrl) {
		envLines.push(`FRONTEND_URL=${config.frontendUrl}`)
	}

	envLines.push('')

	const envPath = path.join(tempDir, 'backend.env')
	await fsp.writeFile(envPath, envLines.join('\n'), { encoding: 'utf8' })
	return envPath
}

const writeSystemdServiceFile = async (config, tempDir) => {
	const contents = `[Unit]\n` +
		`Description=UniwSwap Backend API\n` +
		`After=network.target\n\n` +
		`[Service]\n` +
		`Type=simple\n` +
		`User=${config.serviceUser}\n` +
		`WorkingDirectory=${REMOTE_TARGETS.backendDir}\n` +
		`EnvironmentFile=${REMOTE_TARGETS.backendDir}/.env\n` +
		`ExecStart=/usr/bin/node index.js\n` +
		`Restart=on-failure\n` +
		`RestartSec=5\n` +
		`StandardOutput=journal\n` +
		`StandardError=journal\n\n` +
		`[Install]\n` +
		`WantedBy=multi-user.target\n`

	const servicePath = path.join(tempDir, 'uniwswap-backend.service')
	await fsp.writeFile(servicePath, contents, { encoding: 'utf8' })
	return servicePath
}

const writeNginxConfigFile = async (config, tempDir) => {
	const contents = `server {\n` +
		`    listen 80;\n` +
		`    listen [::]:80;\n` +
		`    server_name ${config.serverName};\n\n` +
		`    root ${REMOTE_TARGETS.frontendDir};\n` +
		`    index index.html index.htm;\n\n` +
		`    access_log /var/log/nginx/uniwswap-access.log;\n` +
		`    error_log /var/log/nginx/uniwswap-error.log warn;\n\n` +
		`    gzip on;\n` +
		`    gzip_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss image/svg+xml;\n` +
		`    gzip_min_length 10240;\n\n` +
		`    location /api/ {\n` +
		`        proxy_pass http://127.0.0.1:${config.backendPort}/api/;\n` +
		`        proxy_http_version 1.1;\n` +
		`        proxy_set_header Upgrade $http_upgrade;\n` +
		`        proxy_set_header Connection "Upgrade";\n` +
		`        proxy_set_header Host $host;\n` +
		`        proxy_set_header X-Real-IP $remote_addr;\n` +
		`        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n` +
		`        proxy_cache_bypass $http_upgrade;\n` +
		`    }\n\n` +
		`    location /socket.io/ {\n` +
		`        proxy_pass http://127.0.0.1:${config.backendPort}/socket.io/;\n` +
		`        proxy_http_version 1.1;\n` +
		`        proxy_set_header Upgrade $http_upgrade;\n` +
		`        proxy_set_header Connection "Upgrade";\n` +
		`        proxy_set_header Host $host;\n` +
		`        proxy_set_header X-Real-IP $remote_addr;\n` +
		`        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n` +
		`        proxy_cache_bypass $http_upgrade;\n` +
		`    }\n\n` +
		`    location /admin {\n` +
		`        try_files $uri $uri/ /index.html;\n` +
		`    }\n\n` +
		`    location / {\n` +
		`        try_files $uri $uri/ /index.html;\n` +
		`    }\n}\n`

	const nginxPath = path.join(tempDir, 'uniwswap.conf')
	await fsp.writeFile(nginxPath, contents, { encoding: 'utf8' })
	return nginxPath
}

const ensureTempDir = async () => {
	const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'uniwswap-deploy-'))
	return tempDir
}

const cleanupTempDir = async (tempDir) => {
	if (!tempDir) return
	try {
		await fsp.rm(tempDir, { recursive: true, force: true })
	} catch (error) {
		console.log(`${emoji.warn}Failed to cleanup temp dir ${tempDir}: ${error.message}`)
	}
}

const connectSsh = (config) => {
	return new Promise((resolve, reject) => {
		const client = new Client()

		client.on('ready', () => {
			console.log(`${emoji.success}SSH connection established with ${config.host}`)
			resolve(client)
		})

		client.on('error', (error) => {
			reject(new Error(`SSH error: ${error.message}`))
		})

		const connectionConfig = {
			host: config.host,
			port: config.port,
			username: config.username,
			readyTimeout: config.readyTimeout
		}

		if (config.privateKey) {
			connectionConfig.privateKey = config.privateKey
			if (config.passphrase) {
				connectionConfig.passphrase = config.passphrase
			}
		} else {
			connectionConfig.password = config.password
		}

		client.connect(connectionConfig)
	})
}

const openSftp = (client) => {
	return new Promise((resolve, reject) => {
		client.sftp((error, sftp) => {
			if (error) {
				reject(new Error(`Failed to open SFTP session: ${error.message}`))
			} else {
				resolve(sftp)
			}
		})
	})
}

const uploadFile = (sftp, localPath, remotePath) => {
	return new Promise((resolve, reject) => {
		sftp.fastPut(localPath, remotePath, (error) => {
			if (error) {
				reject(new Error(`Upload failed for ${path.basename(localPath)} -> ${remotePath}: ${error.message}`))
			} else {
				resolve()
			}
		})
	})
}

const escapeForSingleQuotes = (value) => value.replace(/'/g, `'\''`)

const runRemoteCommand = (client, config, command) => {
	const {
		description = command.cmd,
		cmd,
		sudo = false,
		ignoreErrors = false
	} = command

	return new Promise((resolve, reject) => {
		const wrapped = sudo
			? `sudo -S bash -lc '${escapeForSingleQuotes(cmd)}'`
			: `bash -lc '${escapeForSingleQuotes(cmd)}'`

		console.log(`\n${emoji.step}${description}`)

		client.exec(wrapped, { pty: true }, (error, stream) => {
			if (error) {
				reject(error)
				return
			}

			let stderr = ''
			let stdout = ''
			let passwordWritten = false

			const sendPassword = () => {
				if (!passwordWritten) {
					stream.write(`${config.sudoPassword}\n`)
					passwordWritten = true
				}
			}

			if (sudo && config.sudoPassword) {
				// Prime sudo with password immediately to avoid blocking prompts.
				setTimeout(sendPassword, 50)
			}

			stream.on('data', (data) => {
				const text = data.toString()
				stdout += text
				process.stdout.write(text)
			})

			stream.stderr.on('data', (data) => {
				const text = data.toString()
				stderr += text
				if (sudo && !passwordWritten && text.toLowerCase().includes('password')) {
					sendPassword()
					return
				}
				process.stderr.write(text)
			})

			stream.on('close', (code) => {
				if (code === 0) {
					resolve({ code, stdout, stderr })
				} else if (ignoreErrors) {
					console.log(`${emoji.warn}Command failed with exit code ${code} but ignoring as requested.`)
					resolve({ code, stdout, stderr })
				} else {
					const failure = new Error(`Remote command failed (${description}) with exit code ${code}`)
					failure.details = stderr || stdout
					reject(failure)
				}
			})
		})
	})
}

const runRemoteSequence = async (client, config, commands) => {
	for (const command of commands) {
		await runRemoteCommand(client, config, command)
	}
}

const removeConflictsAndInstallDependencies = (client, config) => {
	const commands = [
		{ description: 'Stop nginx (if running)', cmd: 'systemctl stop nginx', sudo: true, ignoreErrors: true },
		{ description: 'Stop Apache (if running)', cmd: 'systemctl stop apache2', sudo: true, ignoreErrors: true },
		{ description: 'Disable Apache service', cmd: 'systemctl disable apache2', sudo: true, ignoreErrors: true },
		{ description: 'Purge Apache packages', cmd: 'apt-get purge -y apache2 apache2-utils apache2-bin apache2-data apache2-doc apache2-suexec-pristine apache2-suexec-custom || true', sudo: true },
		{ description: 'Remove Apache configuration directory', cmd: 'rm -rf /etc/apache2', sudo: true, ignoreErrors: true },
		{ description: 'Stop MongoDB service (if running)', cmd: 'systemctl stop mongod', sudo: true, ignoreErrors: true },
		{ description: 'Purge MongoDB packages', cmd: 'apt-get purge -y mongodb mongodb-org mongodb-org-* || true', sudo: true, ignoreErrors: true },
		{ description: 'Autoremove unused packages', cmd: 'apt-get autoremove -y', sudo: true, ignoreErrors: true },
		{ description: 'Terminate processes bound to port 80', cmd: 'fuser -k 80/tcp', sudo: true, ignoreErrors: true },
		{ description: 'Terminate processes bound to port 443', cmd: 'fuser -k 443/tcp', sudo: true, ignoreErrors: true },
		{ description: 'Update apt cache', cmd: 'apt-get update', sudo: true },
		{ description: 'Install base packages', cmd: 'apt-get install -y curl git build-essential ufw nginx', sudo: true },
		{ description: 'Install Certbot helpers', cmd: 'apt-get install -y python3-certbot-nginx || true', sudo: true, ignoreErrors: true },
		{ description: 'Install NodeSource repository for Node.js 18', cmd: 'curl -fsSL https://deb.nodesource.com/setup_18.x | bash -', sudo: true },
		{ description: 'Install Node.js 18 runtime', cmd: 'apt-get install -y nodejs', sudo: true }
	]

	return runRemoteSequence(client, config, commands)
}

const uploadArtifacts = async (client, artifacts, options) => {
	if (options.skipUpload) {
		console.log(`${emoji.info}Skipping upload of artifacts as requested.`)
		return
	}

	const sftp = await openSftp(client)

	try {
		if (artifacts.backendEnvPath) {
			await uploadFile(sftp, artifacts.backendEnvPath, REMOTE_PATHS.backendEnv)
			console.log(`${emoji.success}Uploaded backend environment file`)
		}

		if (artifacts.systemdServicePath) {
			await uploadFile(sftp, artifacts.systemdServicePath, REMOTE_PATHS.systemdService)
			console.log(`${emoji.success}Uploaded systemd service definition`)
		}

		if (artifacts.nginxConfigPath) {
			await uploadFile(sftp, artifacts.nginxConfigPath, REMOTE_PATHS.nginxSite)
			console.log(`${emoji.success}Uploaded nginx site configuration`)
		}

		if (artifacts.backendArchivePath) {
			await uploadFile(sftp, artifacts.backendArchivePath, REMOTE_PATHS.backendTar)
			console.log(`${emoji.success}Uploaded backend package archive`)
		}

		if (artifacts.frontendArchivePath) {
			await uploadFile(sftp, artifacts.frontendArchivePath, REMOTE_PATHS.frontendTar)
			console.log(`${emoji.success}Uploaded frontend static bundle`)
		}
	} finally {
		sftp.end()
	}
}

const configureServer = async (client, config, artifacts, options) => {
	const commands = []

	commands.push(
		{ description: 'Create deployment directories', cmd: `mkdir -p ${REMOTE_TARGETS.stateDir} ${REMOTE_TARGETS.frontendDir}`, sudo: true }
	)

	if (artifacts.backendArchivePath) {
		commands.push(
			{ description: 'Reset backend directory', cmd: `rm -rf ${REMOTE_TARGETS.backendDir}`, sudo: true },
			{ description: 'Create backend directory', cmd: `mkdir -p ${REMOTE_TARGETS.backendDir}`, sudo: true },
			{ description: 'Unpack backend release', cmd: `tar -xzf ${REMOTE_PATHS.backendTar} -C ${REMOTE_TARGETS.backendDir}`, sudo: true },
			{ description: 'Set backend ownership', cmd: `chown -R ${config.serviceUser}:${config.serviceUser} ${REMOTE_TARGETS.backendDir}`, sudo: true },
			{ description: 'Move backend env file into place', cmd: `mv ${REMOTE_PATHS.backendEnv} ${REMOTE_TARGETS.backendDir}/.env`, sudo: true },
			{ description: 'Protect backend env file', cmd: `chmod 600 ${REMOTE_TARGETS.backendDir}/.env`, sudo: true },
			{ description: 'Install backend production dependencies', cmd: `sudo -H -u ${config.serviceUser} npm --prefix ${REMOTE_TARGETS.backendDir} install --omit=dev --no-audit --no-fund`, sudo: true }
		)
	}

	if (artifacts.frontendArchivePath) {
		commands.push(
			{ description: 'Reset frontend directory', cmd: `rm -rf ${REMOTE_TARGETS.frontendDir}/*`, sudo: true, ignoreErrors: true },
			{ description: 'Unpack frontend build', cmd: `tar -xzf ${REMOTE_PATHS.frontendTar} -C ${REMOTE_TARGETS.frontendDir}`, sudo: true },
			{ description: 'Set frontend ownership', cmd: `chown -R www-data:www-data ${REMOTE_TARGETS.frontendDir}`, sudo: true },
			{ description: 'Set frontend directory permissions', cmd: `find ${REMOTE_TARGETS.frontendDir} -type d -exec chmod 755 {} +`, sudo: true },
			{ description: 'Set frontend file permissions', cmd: `find ${REMOTE_TARGETS.frontendDir} -type f -exec chmod 644 {} +`, sudo: true }
		)
	}

	commands.push(
		{ description: 'Install systemd service', cmd: `mv ${REMOTE_PATHS.systemdService} ${REMOTE_TARGETS.systemdService}`, sudo: true },
		{ description: 'Install nginx site configuration', cmd: `mv ${REMOTE_PATHS.nginxSite} ${REMOTE_TARGETS.nginxAvailable}`, sudo: true },
		{ description: 'Enable nginx site', cmd: `ln -sf ${REMOTE_TARGETS.nginxAvailable} ${REMOTE_TARGETS.nginxEnabled}`, sudo: true },
		{ description: 'Disable default nginx site', cmd: 'rm -f /etc/nginx/sites-enabled/default', sudo: true, ignoreErrors: true },
		{ description: 'Reload systemd configuration', cmd: 'systemctl daemon-reload', sudo: true }
	)

	if (artifacts.backendArchivePath) {
			commands.push(
				{ description: 'Enable backend service', cmd: 'systemctl enable uniwswap-backend.service', sudo: true },
				{ description: 'Restart backend service', cmd: 'systemctl restart uniwswap-backend.service', sudo: true }
			)
	}

	commands.push(
		{ description: 'Test nginx configuration', cmd: 'nginx -t', sudo: true },
		{ description: 'Restart nginx service', cmd: 'systemctl restart nginx', sudo: true }
	)

	if (artifacts.backendArchivePath) {
		commands.push(
			{ description: 'Verify backend health endpoint', cmd: `curl -fsSL http://127.0.0.1:${config.backendPort}/api/health`, sudo: true }
		)
	}

	commands.push(
		{ description: 'Remove temporary archives', cmd: `rm -f ${REMOTE_PATHS.backendTar} ${REMOTE_PATHS.frontendTar}`, sudo: true, ignoreErrors: true }
	)

	return runRemoteSequence(client, config, commands)
}

const previewRemotePlan = (config, artifacts) => {
	console.log('\nPlanned remote operations:')
	const stages = [
		'1. Stop and remove Apache / MongoDB leftovers.',
		'2. Kill processes bound to ports 80/443.',
		'3. Install curl, git, build-essential, nginx, certbot, and Node.js 18.',
		artifacts.backendArchivePath ? '4. Upload backend package, install dependencies, and configure systemd service.' : null,
		artifacts.frontendArchivePath ? '5. Upload frontend static build and configure nginx reverse proxy.' : null,
		'6. Validate nginx configuration and restart services.',
		artifacts.backendArchivePath ? '7. Call backend /api/health endpoint for sanity check.' : null
	].filter(Boolean)

	for (const line of stages) {
		console.log(` - ${line}`)
	}

	console.log('\nNo commands were executed because --dry-run was supplied.')
}

const main = async () => {
	const argv = process.argv.slice(2)
	const options = parseArgs(argv)

	const tempDir = await ensureTempDir()
	let config

	try {
		config = await loadConfig(options)

		const frontendArchivePath = await buildFrontend(options, tempDir)
		const backendArchivePath = await packageBackend(options, tempDir)
		const backendEnvPath = await writeBackendEnvFile(config, tempDir)
		const systemdServicePath = await writeSystemdServiceFile(config, tempDir)
		const nginxConfigPath = await writeNginxConfigFile(config, tempDir)

		const artifacts = {
			frontendArchivePath,
			backendArchivePath,
			backendEnvPath,
			systemdServicePath,
			nginxConfigPath
		}

		if (options.dryRun) {
			previewRemotePlan(config, artifacts)
			return
		}

		const client = await connectSsh(config)

		try {
			await removeConflictsAndInstallDependencies(client, config)
			await uploadArtifacts(client, artifacts, options)
			await configureServer(client, config, artifacts, options)
			console.log(`\n${emoji.success}Deployment completed successfully.`)
		} finally {
			client.end()
		}
	} catch (error) {
		console.error(`\n${emoji.error}Deployment failed: ${error.message}`)
		if (error.details) {
			console.error(error.details)
		}
		process.exitCode = 1
	} finally {
		await cleanupTempDir(tempDir)
	}
}

process.on('unhandledRejection', (error) => {
	console.error(`${emoji.error}Unhandled rejection: ${error.message}`)
	process.exitCode = 1
})

main()
