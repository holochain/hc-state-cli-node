import { listDnas, listCellIds, listActiveApps, dumpState } from "./utils";

const main = async () => {
    const argv = process.argv;
    let context, result;

    if (argv[2] === '--list-dnas' || argv[2] === '-d') {
        context = `Installed DNAs:`;
        result = await listDnas();
    } else if (argv[2] === '--list-cell-ids' || argv[2] === '-c') {
        context = `Installed CellIds:`;
        result = await listCellIds();
    } else if (argv[2] === '--list-active-app-ids' || argv[2] === '-a') {
        context = `Active App Ids:`;
        result = await listActiveApps();
    } else if (argv[2] === '--state-dump' || argv[2] === '-s') {
        context = `State dump:`;
        result = await dumpState(argv[3]);
    } else if (argv[2] === '--help' || argv[2] === '-h') {
        result = `
    CLI tool for querying holochain over admin port (default = 4444)
        usage:
            hc-state --command arg

            -a --list-active-app-ids (no arg) calls listActiveApps(void) -> [AppId: string]
            -c --list-cell-ids (no arg) calls ListCellIds(void) -> [CellId: CellIdBase64]
            -d --list-dnas (no arg) calls ListDnas(void) -> [DnaHash: string]
            -s --state-dump CellIdBase64 calls dumpState(CellIdBase64) -> [stateDump: any]
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
