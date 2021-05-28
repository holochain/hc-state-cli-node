import { getAdminWebsocket, getAppWebsocket, listDnas, listCellIds, listActiveApps, dumpState, appInfo } from "./utils";
const { version } = require('../package.json');
const { Command } = require('commander');

const inputGuide = `
  CLI tool for querying holochain over admin port (default = 4444)
    usage:
      hc-state --command arg

      -a --list-active-app-ids (no arg) calls listActiveApps(void) -> [AppId: string]
      -c --list-cell-ids (no arg) calls ListCellIds(void) -> [CellId: CellIdBase64]
      -d --list-dnas (no arg) calls ListDnas(void) -> [DnaHash: string]
      -s --state-dump CellIdBase64 calls dumpState(CellIdBase64) -> [stateDump: any]
      -i --app-info InstalledAppId calls appInfo(InstalledAppId) -> { installed_app_id: string, cell_data: [{cell_id: CellIdBase64, cell_nick: string}], active: boolean}
      -p --app-port 
      -m --admin-port
      -h --help shows this help

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
      ]"
  `;

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
    .option('-p, --app-port <port>', 'assigns app port for outbound app-interface calls', 42233 )
    .option('-m, --admin-port <port>', 'assigns admin port for outbond admin-interface calls', 4444 )
    // .addHelpText('afterAll', inputGuide)
    
    program
    .command("listDnas")
    .alias('d')
    .description("lists installed DNAs")
    .action(async (cmd) => {
      // console.log('listDnas cmd %s', cmd);
      const result = await call_admin_port(listDnas, program.opts().adminPort);
      console.log(`Installed DNAs:`);
      console.log(result);
    })
  
    program.parse( process.argv );
}

try {
  getArgs()
    .then(()=> process.exit())
    .catch((error) => { throw new Error(error) });
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
