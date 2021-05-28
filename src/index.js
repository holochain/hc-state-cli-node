import { listDnas, listCellIds, listActiveApps, dumpState, appInfo } from "./utils";
import yargs from "yargs";
import { hideBin } from "yargs";
// const { hideBin } = require("yargs/helpers")

function inputGuide() {
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
  `)
}; 

export function getArgs() {
  const yarg = yargs(hideBin(process.argv))
    .help()
    .option("admin-port", {
      alias: "m",
      type: "integer",
      default: 4444,
      description:
        "assigns admin port for outbond admin-interface calls",
    })
    .option("port", {
      alias: "p",
      type: "integer",
      default: 8888,
      description:
        "assigns app port for outbound app-interface calls",
    })
    .option("list-dnas", {
      alias: "d",
      description:
        "lists installed DNAs",
    })
    .option("list-cell-ids", {
      alias: "c",
      description:
        "lists installed cells IDs",
    })
    .option("state-dump", {
      alias: "s",
      type: "string",
      description:
        "dumps chain state for app",
    })
    .option("list-active-app-ids", {
      alias: "a",
      description:
        "lists active app IDs",
    })
    .option("app-info", {
      alias: "i",
      type: "string",
      description:
        "prints app info for app",
    })
    .help('info')
    .argv;

  console.log(argv);

  if (yarg.help) inputGuide();
  if (yarg.useAlternativeConductorPort && (typeof yarg.useAlternativeConductorPort !== 'number')) inputGuide('Cannot use -x flag without providing a port number of type integer.');
  
  return {
    appPort: yarg.port,
    adminPort: yarg.adminPort,
    listDnas: yarg.listDnas,
    listCellIds: yarg.listCellIds,
    listActiveAppIds: yarg.listActiveAppIds,
    stateDump: yarg.stateDump,
    appInfo: yarg.appInfo
  };
}

async function processArgs(args) {
  let context, result;
  switch (args) {
    case args.listDnas:
      context = `Installed DNAs:`;
      result = await listDnas();
      break;
    case args.listCellIds:
      context = `Installed CellIds:`;
      result = await listCellIds();
      break;
    case args.listActiveAppIds:
      context = `Active App Ids :`;
      result = await listActiveApps();
      break;
    case args.stateDump:
      context = `State dump:`;
      result = await dumpState();
      break; 
    case args.appInfo:
      context = `App info:`;
      result = await appInfo();
      break;  
    default:
      console.error('Received an unexpected argument');
      inputGuide();
      break;
  }

  if (context) console.log(context);
  console.log(result);
}

try {
  const args = getArgs();
  processArgs(args)
      .then(()=> process.exit())
      .catch(() => { throw new Error(error) });
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
