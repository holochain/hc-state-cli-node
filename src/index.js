import { getAdminWebsocket, getAppWebsocket, listDnas, listCellIds, listActiveApps, dumpState, appInfo, zomeCall } from './utils'
import { inspect } from 'util'
const { version } = require('../package.json')
const { Command } = require('commander')
const blake = require('blakejs')

const HOLO_HASH_AGENT_PREFIX = Buffer.from(new Uint8Array([0x84, 0x20, 0x24]).buffer)
const HOLO_HASH_DNA_PREFIX = Buffer.from(new Uint8Array([0x84, 0x2d, 0x24]).buffer)

// Generate holohash 4 byte (or u32) dht "location" - used for checksum and dht sharding
function calc_dht_bytes (data) {
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

const call_admin_port = async (async_fn, port, args) => {
  const argsLog = args ? args.toString() : 'none'
  try {
    console.log('Invoking call to Admin-Interface on port (%s) with args (%s)', port, argsLog)
    const adminWebsocket = await getAdminWebsocket(port)
    return await async_fn(adminWebsocket, args)
  } catch (error) {
    throw new Error(error)
  }
}

const call_app_port = async (async_fn, port, args) => {
  const argsLog = args ? args.toString() : 'none'
  try {
    console.log('Invoking call to App-Interface on port (%s) with args (%s) ', port, argsLog)
    const appWebsocket = await getAppWebsocket(port)
    return await async_fn(appWebsocket, args)
  } catch (error) {
    throw new Error(error)
  }
}

export async function getArgs () {
  const program = new Command()

  program
    .version(version)
    .description(`CLI tool for querying holochain over admin port (default = 4444) or app port (default = 42233)
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
  `)
    .option('-p, --app-port <port>', 'assigns app port for outbound app-interface calls', 42233)
    .option('-m, --admin-port <port>', 'assigns admin port for outbond admin-interface calls', 4444)

  program
    .command('listDnas')
    .alias('d')
    .description('list installed DNAs: calls ListDnas(void) -> [DnaHash: string]')
    .action(async () => {
      const result = await call_admin_port(listDnas, program.opts().adminPort)
      console.log('Installed DNAs:')
      console.log(result)
    })

  program
    .command('listCellIds')
    .alias('c')
    .description('list installed cells IDs: calls listCellIds(void) -> [CellId: CellIdBase64]')
    .action(async () => {
      const result = await call_admin_port(listCellIds, program.opts().adminPort)
      console.log('Installed CellIds:')
      console.log(result)
    })

  program
    .command('listActiveApps')
    .alias('a')
    .description('list active app IDs: calls listActiveApps(void) -> [AppId: string]')
    .action(async () => {
      const result = await call_admin_port(listActiveApps, program.opts().adminPort)
      console.log('Active App IDs:')
      console.log(result)
    })

  program
    .command('stateDump <CellIdBase64>')
    .alias('s')
    .description('dump chain state for app: calls dumpState(CellIdBase64) -> [stateDump: any]')
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
      const result = await call_admin_port(dumpState, program.opts().adminPort, CellIdBase64)
      console.log('State Dump for App:')
      console.log(result)
    })

  program
    .command('appInfo <InstalledAppId>')
    .alias('i')
    .description('print app info for app: calls appInfo(InstalledAppId) -> { installed_app_id: string, cell_data: [{cell_id: CellIdBase64, cell_nick: string}], active: boolean}')
    .action(async (installedAppId) => {
      const result = await call_app_port(appInfo, program.opts().appPort, installedAppId)
      console.log('App Info for App:')
      console.log(result)
    })

  program
    .command('zomeCall <DnaHash> <AgentHash> <ZomeName> <ZomeFunction> <Payload>')
    .alias('z')
    .description('call zome function for cell: calls callZome(cell_id, agent_pubkey, zome_name, fn_name) -> ZomeCallResult: any')
    .action(async (DnaHash, AgentHash, ZomeName, ZomeFunction, Payload) => {
      let payload
      if (Payload && Object.keys(Payload) >= 1) {
      // const cleanedPayload = Payload.match(/{[^}]+}/).toString();
      // const formattedPayload = cleanedPayload.replace(/([a-zA-Z]+):/g,'"$1":');
      // console.log('formattedPayload : ', formattedPayload)
        try {
          payload = JSON.parse(Payload)
          console.log('JSON.parse(formattedPayload) : ', payload)
          // payload = JSON.parse(formattedPayload);
          // console.log('JSON.parse(formattedPayload) : ', JSON.parse(formattedPayload))
        } catch (error) {
          throw new Error('ZomeCall Payload was not provided as a JSON string.')
        }
      } else {
        console.warn('No ZomeCall Payload provided, will pass zome call payload as null.')
        payload = null
      }

      const getHoloHash = (holoHashPrefix, buf) => {
        return Buffer.concat([
          holoHashPrefix,
          buf,
          calc_dht_bytes(buf)
        ])
      }
      const dnaBuffer = (DnaHash.indexOf('u') === 0 && Buffer.from(DnaHash, 'base64').length === 39) ? getHoloHash(HOLO_HASH_DNA_PREFIX, Buffer.from(DnaHash.slice(1), 'base64').slice(3, -4)) : Buffer.from(DnaHash, 'base64')
      const agentBuffer = (AgentHash.indexOf('u') === 0 && Buffer.from(AgentHash, 'base64').length === 39) ? getHoloHash(HOLO_HASH_AGENT_PREFIX, Buffer.from(AgentHash.slice(1), 'base64').slice(3, -4)) : Buffer.from(AgentHash, 'base64')

      console.log('DnaHash ', DnaHash)
      console.log('AgentHash ', AgentHash)

      console.log('????????????? ', dnaBuffer.length)
      console.log('????????????? ', agentBuffer.length)

      const args = {
        cell_id: [dnaBuffer, agentBuffer],
        zome_name: ZomeName,
        fn_name: ZomeFunction,
        payload: {},
        provenance: agentBuffer
      }

      console.log('Calling zome function with args %s', inspect(args))

      const result = await call_app_port(zomeCall, program.opts().appPort, args)
      console.log('Zome Call Result :')
      console.log(result)
    })

  await program.parseAsync(process.argv)
}

try {
  getArgs()
    .then(() => process.exit())
    .catch(e => console.error(e))
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
