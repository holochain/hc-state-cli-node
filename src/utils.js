import { AdminWebsocket, AppWebsocket } from '@holochain/conductor-api'
import { inspect } from 'util'

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
    hash: true
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
 * Creates and returns websocket connection to admin interface of Holochain
 * @returns {AdminWebsocket}
 */
export const getAdminWebsocket = async (adminPort) => {
  if (adminWebsocket) return adminWebsocket

  adminWebsocket = await AdminWebsocket.connect(
      `ws://localhost:${adminPort}`
  )
  console.log(`Successfully connected to admin interface on port ${adminPort}`)
  return adminWebsocket
}

/**
 * Creates and returns websocket connection to app interface of Holochain
 * @returns {AppWebsocket}
 */
export const getAppWebsocket = async (appPort) => {
  if (appWebsocket) return appWebsocket

  appWebsocket = await AppWebsocket.connect(
      `ws://localhost:${appPort}`
  )
  console.log(`Successfully connected to app interface on port ${appPort}`)
  return appWebsocket
}

/**
 * Lists array of all the installed DNAs in base64 format
 * @returns {Array}
 */
export const listDnas = async (adminWebsocket) => {
  let result = await adminWebsocket.listDnas()

  if (Array.isArray(result)) { result = result.map(dna => dna.toString('base64')) }

  return result
}

/**
 * Lists array of all created cell ids in a format [DnaHashBase64, AgentPubKeyBase64]
 * @returns {Array}
 */
export const listCellIds = async (adminWebsocket) => {
  let result = await adminWebsocket.listCellIds()

  if (Array.isArray(result)) { result = result.map(cell_id => [cell_id[0].toString('base64'), cell_id[1].toString('base64')]) }

  return result
}

/**
 * Lists array of all active apps
 * @returns {Array}
 */
export const listActiveApps = async (adminWebsocket) => {
  let result
  try {
    result = await adminWebsocket.listActiveApps()
  } catch (e) {
    throw new Error(`${JSON.stringify(e)}`)
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
      throw new Error('Error parsing cell_id: cell_id should be an array [DnaHashBase64, AgentPubKeyBase64]')
    }
  }

  console.log('CellId in Buffer format : ', cellId)
  if (cellId.length !== 2) throw new Error('cell_id is in improper format. Make sure both the dna and agent hash are passed as a single, non-spaced array.')
  else if (cellId[0].length !== 39 || cellId[1].length !== 39) throw new Error('cell_id contains a hash of improper length. Make sure both the dna and agent hash are passed as a single, non-spaced array.')
  let stateDump
  try {
    stateDump = await adminWebsocket.dumpState({
      cell_id: cellId
    })
  } catch (e) {
    throw new Error(`${JSON.stringify(e)}`)
  }
  // Replace all the buffers with byte64 representations
  const result = stringifyBuffRec(stateDump)
  return JSON.stringify(result, null, 4) + `\n\nTotal Elements in Dump: ${stateDump.length}`
}

/**
 * Shows app info for given app id
 * @param { string } installedAppId
 * @returns string
*/
export const appInfo = async (appWebsocket, installedAppId) => {
  if (!installedAppId) throw new Error('No installed_app_id passed.')
  let result
  try {
    result = await appWebsocket.appInfo({ installed_app_id: installedAppId })
  } catch (error) {
    console.error('Error when calling AppInfo: ', error)
  }

  if (!result.cell_data) return `No cell data found for installed_app_id : ${installedAppId}`

  return {
    ...result,
    cell_data: result.cell_data.map(cell => ({
      ...cell,
      cell_id: inspect(
        cell.cell_id.map(id => id.toString('base64'))
      )
    }))
  }
}


/**
 * Call callZome for given cell (with params)
 * @param { obj } installedAppId
 * @returns ZomeCallResult : any
*/
export const zomeCall = async (appWebsocket, args) => {
    if (!args) throw new Error(`Error: No args provided for callZome.`);
	let result;
	try {
    result = await appWebsocket.callZome(args);
	} catch (error) {
    return error
	}
}
