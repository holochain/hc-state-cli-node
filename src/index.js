import fs from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
const chalk = require('chalk');

// import { listDnas, listCellIds, listActiveApps, dumpState, appInfo } from "./utils";

function inputGuide(msg, help = false) {
    const logMsg = msg || '';
    throw new Error(`
    CLI tool for querying holochain over admin port (default = 4444)
        usage:
            hc-state --command arg

            -a --list-active-app-ids (no arg) calls listActiveApps(void) -> [AppId: string]
            -c --list-cell-ids (no arg) calls ListCellIds(void) -> [CellId: CellIdBase64]
            -d --list-dnas (no arg) calls ListDnas(void) -> [DnaHash: string]
            -s --state-dump CellIdBase64 calls dumpState(CellIdBase64) -> [stateDump: any]
            -i --app-info InstalledAppId calls appInfo(InstalledAppId) -> { installed_app_id: string, cell_data: [{cell_id: CellIdBase64, cell_nick: string}], active: boolean}
            -p --app-port 
            -f --admin-port
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
`)}
  

export function getArgs() {
    const yarg = yargs(hideBin(process.argv))
      .help()
      .option("port", {
        alias: "p",
        type: "integer",
        default: 8888,
        description:
          "print port where the application interface of the conductor will be attached",
      })
      .option("admin-port", {
        alias: "f",
        type: "integer",
        description:
          "print port where the admin interface of the conductor will be attached",
      })
      .option("list-dnas", {
        alias: "d",
        type: "string",
        description:
          "list of installed DNAs",
      })
      .option("list-cell-ids", {
        alias: "c",
        type: "string",
        description:
          "list of installed cells IDs",
      })
      .option("list-cell-ids", {
        alias: "c",
        type: "string",
        description:
          "list of installed cells IDs",
      })
      .option("list-active-app-ids", {
        alias: "a",
        type: "string",
        description:
          "list active app IDs",
      })
      .option("state-dump", {
        alias: "s",
        type: "string",
        description:
          "dump chain state for app",
      })
      .option("app-info", {
        alias: "i",
        type: "string",
        description:
          "print app info",
      })
      .help('info')
      .argv;

      if (yarg.help) inputGuide(null, yarg.help);
      if (yarg.useAlternativeConductorPort && (typeof yarg.useAlternativeConductorPort !== 'number')) inputGuide('Cannot use -x flag without providing a port number of type integer.');
      
      return {
        appPort: yarg.port,
        adminPort: yarg.adminPort,
        listDnas: yarg.listDnas,
        // ...
    };
}



async function processArgs(args) {
    // If the admin port was set by the user, we shouldn't change it
    let adminPort = appToInstall.adminPort;
    if (!adminPort) {
      // Find a free port for the admin websocket,
      // but only if the admin port was not set by the user
      adminPort = await getPort({ port: appToInstall.adminPort });
    }
  
    let configCreated, realAdminPort
    if (!appToInstall.useAltConductorPort) {
      // Execute holochain
      ([configCreated, realAdminPort] = await execHolochain(
        adminPort,
        appToInstall.runPath,
        appToInstall.proxyUrl
        ));
      } else {
        realAdminPort = appToInstall.useAltConductorPort
        console.log(chalk.bold.blue(`Skipping internal Holochain Conductor setup and instead connecting to admin port of running Conductor at ${realAdminPort}.`))
    }
  
    // If the config file was created assume we also need to install everything
    if (configCreated || appToInstall.useAltConductorPort) {
        await sleep(100);
      
        let adminWebsocket;
        try {
          adminWebsocket = await AdminWebsocket.connect(
            `ws://localhost:${realAdminPort}`
          );        
        } catch (error) {
          throw new Error('Failed to connect to Admin Interface. Error: ', error);
        }
  
        let agentPubKey;
        if (!appToInstall.multipleAgents) {
          console.log(chalk.bold.blue('(-m FLAG OFF) Generating single agent pub key for all apps.'));
          try {
            agentPubKey = await genPubKey(adminWebsocket);
          } catch (error) {
            throw new Error('Unable to generate agent key. Error : ', error);
          }
        }
  
        if (appToInstall.happs) {
        const happs = yaml.safeLoad(fs.readFileSync(appToInstall.happs, 'utf8'));
        for(let happ of happs){
          await installApp(adminWebsocket, agentPubKey, happ.app_port,  happ.dnas, happ.app_name);
        }
      } else {
        await installApp(adminWebsocket, agentPubKey, appToInstall.appPort,  appToInstall.dnas, appToInstall.installedAppId);
      }
      await adminWebsocket.client.close();
    }
  }

try {
    const args = getArgs();
    processArgs(args)
        .then(()=> process.exit())
        .catch(() => { throw new Error(error) });
  } catch (e) {
    console.error(e.message);
    process.exit(1)
  }
