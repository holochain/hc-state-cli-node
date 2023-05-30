import { AdminWebsocket, AppWebsocket } from "@holochain/client";
import { inspect } from 'util'
const fs = require('fs')
const tmp = require('tmp')
const request = require('request')
const blake = require('blakejs')

let adminWebsocket, appWebsocket

/**
 * Iterates recursively over deeply nested object values and converts each value that is Buffer
 * (exactly array representation of Buffer) into base64 representation of Buffer.
 *
 * Identifies Buffers by object key name being one of buffer_keys.
 *
 * @param {Object} obj
 * @returns {Object}
 */
const stringifyBuffRec = (obj) => {
	const buffer_keys = {
		signature: true,
		header_address: true,
		author: true,
		prev_header: true,
		base_address: true,
		target_address: true,
		tag: true,
		entry_hash: true,
		entry: true,
		hash: true,
	}

	if (Array.isArray(obj) || (typeof obj === 'object' && obj !== null)) {
		for (const i in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, i)) {
				if (buffer_keys[i] && Array.isArray(obj[i])) {
					obj[i] = Buffer.from(obj[i]).toString('base64')
				} else {
					obj[i] = stringifyBuffRec(obj[i])
				}
			}
		}
	}

	return obj
}

/**
 * Downloads url and saves to tmp file
 * @returns {filePath}
 */
export const downloadFile = async (downloadUrl) => {
	const fileName = tmp.tmpNameSync()
	const file = fs.createWriteStream(fileName)

	// Clean up url
	const urlObj = new URL(downloadUrl)
	urlObj.protocol = 'https'
	downloadUrl = urlObj.toString()

	return new Promise((resolve, reject) => {
		request({
			uri: downloadUrl,
		})
			.pipe(file)
			.on('finish', () => {
				resolve(fileName)
			})
			.on('error', (error) => {
				reject(error)
			})
	})
}

const HOLO_HASH_AGENT_PREFIX = Buffer.from(
	new Uint8Array([0x84, 0x20, 0x24]).buffer
)
const HOLO_HASH_DNA_PREFIX = Buffer.from(
	new Uint8Array([0x84, 0x2d, 0x24]).buffer
)
/**
 * Generates holohash 4 byte (or u32) dht "location" - used for checksum and dht sharding
 * @returns {HoloHash}
 */
function calc_dht_bytes(data) {
	const digest = blake.blake2b(data, null, 16)
	const dht_part = Buffer.from([digest[0], digest[1], digest[2], digest[3]])
	for (const i of [4, 8, 12]) {
		dht_part[0] ^= digest[i]
		dht_part[1] ^= digest[i + 1]
		dht_part[2] ^= digest[i + 2]
		dht_part[3] ^= digest[i + 3]
	}
	return dht_part
}
/**
 * Creates and returns HoloHash of specified type
 * @returns {HoloHash}
 */
export const getHoloHash = (type, hash) => {
	let holoHashPrefix, buf
	if (type === 'agent') {
		holoHashPrefix = HOLO_HASH_AGENT_PREFIX
	} else if (type === 'dna') {
		holoHashPrefix = HOLO_HASH_DNA_PREFIX
	} else {
		throw new Error(
			'Failed to provide correct holohash type during hash buffer creation'
		)
	}

	if (hash.indexOf('u') !== 0) {
		buf = Buffer.from(hash, 'base64').slice(3, -4)
	} else {
		buf = Buffer.from(hash.slice(1), 'base64').slice(3, -4)
	}

	// catch and alert improper hashes prior to call
	if (buf.length !== 32) {
		throw new Error(`provided ${type} hash is an improper length`)
	}

	return Buffer.concat([holoHashPrefix, buf, calc_dht_bytes(buf)])
}

/**
 * Creates and returns websocket connection to admin interface of Holochain
 * @returns {AdminWebsocket}
 */
export const getAdminWebsocket = async (adminPort) => {
	console.log("adminWebsocket : ", adminWebsocket)
	if (adminWebsocket) return adminWebsocket

	console.log("adminPort : ", adminPort)
	console.log("ws://localhost:${adminPort} : ", `ws://localhost:${adminPort}`)

	adminWebsocket = await AdminWebsocket.connect(`ws://127.0.0.1:${adminPort}`)
	console.log(`Successfully connected to admin interface on port ${adminPort}`)
	return adminWebsocket
}

/**
 * Reports whether AppWs exists currrently
 * @returns {Boolean}
 */
export const isAppWebsocketOpen = async (appPort) => !!appWebsocket;

/**
 * Creates and returns websocket connection to app interface of Holochain
 * @returns {AppWebsocket}
 */
export const getAppWebsocket = async (appPort) => {
	if (appWebsocket) return appWebsocket

	appWebsocket = await AppWebsocket.connect(`ws://127.0.0.1:${appPort}`)
	console.log(`Successfully connected to app interface on port ${appPort}`)
	return appWebsocket
}

/**
 * Lists array of all the installed DNAs in base64 format
 * @returns {Array}
 */
export const listDnas = async (adminWebsocket) => {
	let result = await adminWebsocket.listDnas()

	if (Array.isArray(result)) {
		result = result.map((dna) => dna.toString('base64'))
	}

	return result
}

/**
 * Lists array of all created cell ids in a format [DnaHashBase64, AgentPubKeyBase64]
 * @returns {Array}
 */
export const listCellIds = async (adminWebsocket) => {
	let result = await adminWebsocket.listCellIds()

	if (Array.isArray(result)) {
		result = result.map((cell_id) => [
			cell_id[0].toString('base64'),
			cell_id[1].toString('base64'),
		])
	}

	return result
}

/**
 * Lists array of all installed apps
 * @returns {Array}
 */
export const listApps = async (adminWebsocket) => {
	let result
	try {
		result = await adminWebsocket.listApps({ status_filter: null })
	} catch (error) {
		throw new Error(`${JSON.stringify(error)}`)
	}
	return result
}

/**
 * Lists array of all enabled apps
 * @returns {Array}
 */
export const listEnabledApps = async (adminWebsocket) => {
	let result
	try {
		result = await adminWebsocket.listApps({ status_filter: 'enabled' })
	} catch (error) {
		throw new Error(`${JSON.stringify(error)}`)
	}
	return result
}

/**
 * Dumps state of holochain for given cell id in a pretty format
 * @param {CellID | int} cellIdArg
 * @returns string
 */
export const dumpState = async (adminWebsocket, cellIdArg) => {
	console.log('cell Id Arg : ', cellIdArg)
	if (!cellIdArg) throw new Error('No cell_id passed.')
	let cellId

	const index = parseInt(cellIdArg)
	if (`${index}` === cellIdArg) {
		// arg is a index so get cell ID list from conductor
		const result = await adminWebsocket.listCellIds()
		if (Array.isArray(result)) {
			if (index >= result.length) {
				return `CellId index (zero based) provided was ${index}, but there are only ${result.length} cell(s)`
			}
			cellId = result[index]
		} else {
			return `Expected array from listCellIds() got: ${result}`
		}
	} else {
		// Convert cellIdArg into array format to satisfy dumpState arg type
		cellId = cellIdArg.split(',')
		if (Array.isArray(cellId)) {
			cellId[0] = Buffer.from(cellId[0], 'base64')
			cellId[1] = Buffer.from(cellId[1], 'base64')
		} else {
			throw new Error(
				'Error parsing cell_id: cell_id should be an array [DnaHashBase64, AgentPubKeyBase64]'
			)
		}
	}

	console.log('CellId in Buffer format : ', cellId)
	if (cellId.length !== 2)
		throw new Error(
			'cell_id is in improper format. Make sure both the dna and agent hash are passed as a single, non-spaced array.'
		)
	else if (cellId[0].length !== 39 || cellId[1].length !== 39)
		throw new Error(
			'cell_id contains a hash of improper length. Make sure both the dna and agent hash are passed as a single, non-spaced array.'
		)
	let stateDump
	try {
		stateDump = await adminWebsocket.dumpState({
			cell_id: cellId,
		})
	} catch (error) {
		throw new Error(`${JSON.stringify(error)}`)
	}
	// Replace all the buffers with byte64 representations
	const result = stringifyBuffRec(stateDump)
	return (
		JSON.stringify(result, null, 4) +
		`\n\nTotal Elements in Dump: ${stateDump.length}`
	)
}

/**
 * Call installApp for app bundle
 * @param {obj} installAppArgs
 * @returns {obj}
 */
export const installApp = async (adminWebsocket, args) => {
	if (!args) throw new Error('No args provided for installApp.')
	let result
	try {
		result = await adminWebsocket.installApp(args)
	} catch (error) {
		return error
	}
	return result
}

/**
 * Call enableApp for given app id
 * @param {string} installedAppId
 * @returns {void}
 */
export const enableApp = async (adminWebsocket, installedAppId) => {
	if (!installedAppId)
		throw new Error('No installed_app_id passed to enableApp.')
	let result
	try {
		result = await adminWebsocket.enableApp({
			installed_app_id: installedAppId,
		})
	} catch (error) {
		console.error('Error when calling enableApp: ', error)
	}
	return result
}

/**
 * Shows appInfo for given app id
 * @param {string} installedAppId
 * @returns {string}
 */
export const appInfo = async (appWebsocket, installedAppId) => {
	if (!installedAppId) throw new Error('No installed_app_id passed to appInfo.')
	let result
	try {
		result = await appWebsocket.appInfo({ installed_app_id: installedAppId })
	} catch (error) {
		console.error('Error when calling AppInfo: ', error)
	}

	if (!result.cell_data)
		return `No cell data found for installed_app_id : ${installedAppId}`

	return {
		...result,
		cell_data: result.cell_data.map((cell) => ({
			...cell,
			cell_id: inspect(cell.cell_id.map((id) => id.toString('base64'))),
		})),
	}
}

/**
 * Call callZome for given cell (with params)
 * @param {obj} zomeCallArgs
 * @returns {ZomeCallResult}
 */
export const zomeCall = async (appWebsocket, args) => {
	if (!args) throw new Error('No args provided for callZome.')
	let result
	try {
		result = await appWebsocket.callZome(args)
	} catch (error) {
		return error
	}
	return result
}
