import { getAdminWebsocket, getAppWebsocket, listDnas, listCellIds, listActiveApps, dumpState, appInfo } from "./utils";
const { version } = require('../package.json');
const { Command } = require('commander');

const call_admin_port = async (async_fn, port) => {
  console.log("Invoking call to Admin-Interface on port : ", port);
  const adminWebsocket = await getAdminWebsocket(port)
  console.log('admin ws : ', adminWebsocket)
  try {
    return await async_fn(adminWebsocket)
  } catch (error) {
    throw new Error(error)
  }
}

const call_app_port = async (async_fn, port) => {
  console.log("Invoking call to App-Interface on port : ", port);
  const appWebsocket = await getAppWebsocket(port)
  try {
    return await async_fn(appWebsocket)
  } catch (error) {
    throw new Error(error)
  }
}

export async function getArgs() {
  const program = new Command();

  program
    .version(version)
    .description(`CLI tool for querying holochain over admin port (default = 4444) or app port (default = 42233)
  where
    CellIdBase64 =
      [
        DnaHashBase64: string, // base64 representation of Buffer length 39
        AgentPubKeyBase64: string // base64 representation of Buffer length 39
      ]
      or numeric index of cell ID returned by ListCellIds
    
  example
    hc-state -s "[
      'hC0kqcfqvJ8krBR0bNnPsmLtFiEiMOHM0fX+U8FW+ROc7P10tUdc',
      'hCAkcIRv7RZNVg8FWc6/oJZo04dZTXm7JP6tfMk3RptPY02cBQac'
    ]`)
    .option('-p, --app-port <port>', 'assigns app port for outbound app-interface calls', 42233 )
    .option('-m, --admin-port <port>', 'assigns admin port for outbond admin-interface calls', 4444 )
    
  program
    .command("listDnas")
    .alias('d')
    .description("list installed DNAs: calls ListDnas(void) -> [DnaHash: string]")
    .action(async () => {
      const result = await call_admin_port(listDnas, program.opts().adminPort);
      console.log(`Installed DNAs:`);
      console.log(result);
    })
    
  program
    .command("listCellIds")
    .alias('c')
    .description(`list installed cells IDs: calls listCellIds(void) -> [CellId: CellIdBase64]`)
    .action(async () => {
      const result = await call_admin_port(listCellIds, program.opts().adminPort);
      console.log(`Installed CellIds:`);
      console.log(result);
    })

  program
    .command("listActiveApps")
    .alias('a')
    .description("list active app IDs: calls listActiveApps(void) -> [AppId: string]")
    .action(async () => {
      const result = await call_admin_port(listActiveApps, program.opts().adminPort);
      console.log(`Active App IDs:`);
      console.log(result);
    })

  program
    .command("stateDump")
    .alias('s')
    .description("dump chain state for app: calls dumpState(CellIdBase64) -> [stateDump: any]")
    .action(async (cmd) => {
      // console.log(' 1 cmd %s', cmd);
      const result = await call_admin_port(dumpState, program.opts().adminPort);
      console.log(`State Dump for App:`);
      console.log(result);
    })  

  program
    .command("appInfo")
    .alias('i')
    .description("print app info for app: calls appInfo(InstalledAppId) -> { installed_app_id: string, cell_data: [{cell_id: CellIdBase64, cell_nick: string}], active: boolean}")
    .action(async (cmd) => {
      // console.log(' 2 cmd %s', cmd);
      const result = await call_app_port(appInfo, program.opts().adminPort);
      console.log(`App Info for App:`);
      console.log(result);
    })
    
  await program.parseAsync( process.argv );
}

try {
  getArgs()
    .then(()=> process.exit())
    .catch((error) => { throw new Error(error) });
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
