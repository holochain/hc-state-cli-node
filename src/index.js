import { ADMIN_PORT } from "./config";
import { listDnas, listCellIds, listActiveApps, dumpState } from "./utils";

const fetchAdminPort = (nextArgNumber) => {
    const argv = process.argv;
    if (argv[nextArgNumber] === '--admin-port' || argv[nextArgNumber] === '-p') {
        const adminPort = argv[nextArgNumber + 1];
        return adminPort;
    }
    return ADMIN_PORT;
}

const main = async () => {
    const argv = process.argv;
    let context, result;

    if (argv[2] === '--list-dnas' || argv[2] === '-d') {
        context = `Installed DNAs:`;
        const adminPort = fetchAdminPort(3)
        result = await listDnas(adminPort);
    } else if (argv[2] === '--list-cell-ids' || argv[2] === '-c') {
        context = `Installed CellIds:`;
        const adminPort = fetchAdminPort(3)
        result = await listCellIds(adminPort);
    } else if (argv[2] === '--list-active-app-ids' || argv[2] === '-a') {
        context = `Active App Ids:`;
        const adminPort = fetchAdminPort(3)
        result = await listActiveApps(adminPort);
    } else if (argv[2] === '--state-dump' || argv[2] === '-s') {
        context = `State dump:`;
        const adminPort = fetchAdminPort(4)
        result = await dumpState(argv[3], adminPort);
    } else if (argv[2] === '--help' || argv[2] === '-h') {
        result = `
    CLI tool for querying holochain over admin port (default = 4444)
        usage:
            hc-state --command arg --sub-command arg

            command args:
            -a --list-active-app-ids (no arg) calls listActiveApps(void) -> [AppId: string]
            -c --list-cell-ids (no arg) calls ListCellIds(void) -> [CellId: CellIdBase64]
            -d --list-dnas (no arg) calls ListDnas(void) -> [DnaHash: string]
            -s --state-dump <CellIdBase64> calls dumpState(CellIdBase64) -> [stateDump: any]
            -h --help shows this help

            sub-command arg
            -p --admin-port <PortNumber> provides port number to getAdminWebsocket(portNumber) -> adminWebsocket

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
    } else {
        result = `
    hc-state: no known command specified, type --help for help
`
    }

    if (context) console.log(context);
    console.log(result);
}

main()
    .then(()=> process.exit())
    .catch(e => {
        console.error(e.message);
        process.exit(1);
    });
