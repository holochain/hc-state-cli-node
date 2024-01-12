import {
	getAdminWebsocket,
	getAppWebsocket,
	downloadFile,
	getHoloHash,
	listDnas,
	listCellIds,
	listApps,
	listEnabledApps,
	dumpState,
	installApp,
	enableApp,
	appInfo,
	zomeCall,
} from './utils'
import path from 'path'
import { inspect } from 'util'
const { version } = require('../package.json')
const { Command } = require('commander')

const call_admin_port = async (async_fn, port, args) => {
	try {
		console.log(
			'Invoking call to Admin-Interface on port (%s) with args (%s)',
			port,
			args ? inspect(args) : '{}'
		)
		const adminWebsocket = await getAdminWebsocket(port)
		return await async_fn(adminWebsocket, args)
	} catch (error) {
		throw new Error(error)
	}
}

const authorize_signator = async (admin_port, cell_id) => {
	try {
		const adminWebsocket = await getAdminWebsocket(admin_port)
		if (cell_id) {
			console.log(
				'Authorizing signing credentials for cell_id (%s)',
				cell_id,
			)
			await adminWebsocket.authorizeSigningCredentials(cell_id)
		}		
	} catch (error) {
		throw new Error(inspect(error))
	}
}

const call_app_port = async (async_fn, port, args) => {
	try {
		console.log(
			'Invoking call to App-Interface on port (%s) with args (%s)',
			port,
			args ? inspect(args) : '{}'
		)
		const appWebsocket = await getAppWebsocket(port)
		return await async_fn(appWebsocket, args)
	} catch (error) {
		throw new Error(error)
	}
}

export async function getArgs() {
	const program = new Command()

	program
		.version(version)
		.description(
			`CLI tool for querying holochain over admin port (default = 4444) or app port (default = 42233)
  where
    CellIdBase64 =
      [
        DnaHashBase64: string, // base64 representation of Buffer length 39
        AgentPubKeyBase64: string // base64 representation of Buffer length 39
      ]

  example
    hc-state s "['hC0kqcfqvJ8krBR0bNnPsmLtFiEiMOHM0fX+U8FW+ROc7P10tUdc','hCAkcIRv7RZNVg8FWc6/oJZo04dZTXm7JP6tfMk3RptPY02cBQac']
    // arg is the CellIdBase64 as a continuous string (should not contain spaces)
    or
    hc-state s 0
    // arg is the numeric index of cell ID returned by ListCellIds
  `
		)
		.option(
			'-p, --app-port <port>',
			'assigns app port for outbound app-interface calls',
			42233
		)
		.option(
			'-m, --admin-port <port>',
			'assigns admin port for outbond admin-interface calls',
			4444
		)
		.option(
			'-v, --verbose',
			"prints full tree of the result using util.inspect",
			false
		)

	const logResult = result => {
		if (program.opts().verbose) {
			console.log(inspect(result, { depth: null }))
		} else {
			console.log(result)
		}
	}

	program
		.command('listDnas')
		.alias('d')
		.description(
			'list installed DNAs: calls ListDnas(void) -> [DnaHash: string]'
		)
		.action(async () => {
			const result = await call_admin_port(listDnas, program.opts().adminPort)
			console.log('Installed DNAs:')
			logResult(result)
		})

	program
		.command('listCellIds')
		.alias('c')
		.description(
			'list installed cells IDs: calls listCellIds(void) -> [CellId: CellIdBase64]'
		)
		.action(async () => {
			const result = await call_admin_port(
				listCellIds,
				program.opts().adminPort
			)
			console.log('Installed CellIds:')
			logResult(result)
		})

	program
		.command('listApps')
		.alias('a')
		.description(
			'list all active apps: calls listApps({status_filter: null}) -> [AppId: any]'
		)
		.action(async () => {
			const result = await call_admin_port(listApps, program.opts().adminPort)
			console.log('Installed Apps:')
			logResult(result)
		})

	program
		.command('listEnabledApps')
		.alias('e')
		.description(
			'list holochain enabled apps: calls listApps({status_filter: "enabled"}) -> [AppId: any]'
		)
		.action(async () => {
			const result = await call_admin_port(listEnabledApps, program.opts().adminPort)
			console.log('Holochain Enabled Apps:')
			logResult(result)
		})

	program
		.command('stateDump <CellIdBase64>')
		.alias('s')
		.description(
			'dump chain state for app: calls dumpState(CellIdBase64) -> [stateDump: any]'
		)
		.action(async (CellIdBase64) => {
			if (/\\/.test(CellIdBase64)) {
				CellIdBase64 = CellIdBase64.replace(/\\/g, '')
					.replace(',n', ',')
					.replace("'n'", "'")
					.replace('[n', '[')
					.replace(']n', ']')
					.replace(/''/g, "'")
			}
			CellIdBase64.replace(/ +/g, '').trim()
			const result = await call_admin_port(
				dumpState,
				program.opts().adminPort,
				CellIdBase64
			)
			console.log('State Dump for App:')
			logResult(result)
		})

	program
		.command('installApp <InstalledAppId> <AgentHash> <AppBundleSource>')
		.alias('b')
		.option(
			'-e --membraneProof <membraneProof>',
			'provide membrane proof for app bundle install and runtime validation - should be paired with --roleName'
		)
		.option(
			'-n --roleName <roleName>',
			'provide cell nick - should be paired with --membraneProof'
		)
		.option('-u --network_seed <network_seed>', 'provide network_seed to happ')
		.description(
			'install provided happ bundle with given id and details: calls installApp(installed_app_id, agent_key, source, membrane_proofs?, network_seed?) -> { installed_app_id, cell_data: [ { cell_id, cell_nick } ], status: { inactive: { reason: [Object] } } }'
		)
		.action(
			async (
				InstalledAppId,
				AgentHash,
				AppBundleSource,
				{ membraneProof, roleName, network_seed }
			) => {
				let membraneProofs
				// throw error if one, but not both, of the membraneProof and roleName are present - both are needed to form the membrane_proofs object
				if (!membraneProof ^ !roleName) {
					throw new Error(
						'When installing a happ with membrane proof, both the --membraneProof and --roleName options are required.'
					)
				} else if (membraneProof) {
					membraneProofs = {
						[[roleName]]: Buffer.from(membraneProof, 'base64'),
					}
				}

				let bundleSource
				// eslint-disable-next-line no-useless-escape
				const urlMatcher =
					/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
				if (AppBundleSource.match(urlMatcher)) {
					if (path.extname(AppBundleSource) !== '.happ') {
						throw new Error(
							"Invalid AppBundleSource URL.  Please ensure to provide the url address of your bundle's .happ file."
						)
					}
					console.log('Downloading bundle URL...', AppBundleSource)
					bundleSource = await downloadFile(AppBundleSource)
				} else {
					try {
						const isHappExt = path.extname(AppBundleSource) === '.happ'
						if (!isHappExt)
							throw new Error(
								"Invalid AppBundleSource file path.  Please ensure to provide the url address of your bundle's .happ file."
							)
					} catch (error) {
						throw new Error(
							'Invalid AppBundleSource. The source must be either a file or url path to the .happ file.'
						)
					}
					// note: __dirname is configured to the 'dist' folder, not project root
					const bundlePath = path.join(__dirname, '../', AppBundleSource)
					bundleSource = bundlePath
				}

				const args = {
					agent_key: getHoloHash('agent', AgentHash),
					installed_app_id: InstalledAppId,
					membrane_proofs: membraneProofs || {},
					network_seed: network_seed || null,
					path: bundleSource,
				}

				console.log(
					'\nInstalling new app bundle with with args %s',
					inspect(args)
				)

				const result = await call_admin_port(
					installApp,
					program.opts().adminPort,
					args
				)
				console.log('Installed App Bundle:')
				logResult(result)
			}
		)

	program
		.command('enableApp <InstalledAppId>')
		.alias('o')
		.description(
			'activate provided app bundle: calls enableApp(installed_app_id) -> void'
		)
		.action(async (installedAppId) => {
			// we don't display the returned  for this call as it returns void
			await call_admin_port(
				enableApp,
				program.opts().adminPort,
				installedAppId
			)
			console.log('Enabled App with ID  :  %s ', installedAppId)
		})

	program
		.command('appInfo <InstalledAppId>')
		.alias('i')
		.description(
			'print app info for app: calls appInfo(installed_app_id) -> { installed_app_id: string, cell_data: [{cell_id: CellIdBase64, cell_nick: string}], active: boolean }'
		)
		.action(async (installedAppId) => {
			const result = await call_app_port(
				appInfo,
				program.opts().appPort,
				installedAppId
			)
			console.log('AppInfo Details for App:')
			console.log(inspect(result))
			if (result.status.paused) {
				console.log(
					'Reason cell is paused : ',
					inspect(result.status.paused.reason)
				)
			}
		})

	program
		.command(
			'zomeCall <DnaHash> <AgentHash> <ZomeName> <ZomeFunction> <Payload>'
		)
		.alias('z')
		.description(
			'call zome function for cell: calls callZome(cell_id, zome_name, fn_name, payload, provenence) -> ZomeCallResult: any'
		)
		.action(async (DnaHash, AgentHash, ZomeName, ZomeFunction, Payload) => {
			let payload = null
			function toJSONString(input) {
				const keyMatcher = '([^",{}\\s]+?)'
				const valMatcher = '(?<=: )(.*?)(?=,|}| })'
				const matcher = new RegExp(`${keyMatcher}\\s*:\\s*${valMatcher}`, 'g')
				const parser = (_, key, value) => {
					return `"${key.trim()}":"${value.trim()}"`
				}
				return input.replace(matcher, parser)
			}

			if (Payload !== 'null') {
				try {
					payload = JSON.parse(toJSONString(Payload))
					console.log('final call payload', payload)
				} catch (error) {
					throw new Error(
						'ZomeCall Payload was not provided in format convertible to JSON string.  \nWARNING: Please be sure your string values do not include a colon followed by a space as this will cause an error in the RegEx evaluation.'
					)
				}
			}

			if (!payload || Object.keys(payload).length < 1) {
				console.warn(
					'No ZomeCall Payload provided, will pass zome call payload as null.'
				)
				payload = null
			}

			const args = {
				cell_id: [getHoloHash('dna', DnaHash), getHoloHash('agent', AgentHash)],
				zome_name: ZomeName,
				fn_name: ZomeFunction,
				payload,
				provenance: getHoloHash('agent', AgentHash),
			}

			console.log(
				'\nCalling %s/%s',
				ZomeName,
				ZomeFunction,
			)

			await authorize_signator(program.opts().adminPort, args.cell_id)
			
			const result = await call_app_port(zomeCall, program.opts().appPort, args)
			console.log('\nZome Call Result :')
			
			logResult(result)
		})

	await program.parseAsync(process.argv)
}

getArgs()
	.then(() => process.exit())
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
