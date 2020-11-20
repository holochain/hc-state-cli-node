import { listDnas, listCellIds, listActiveAppIds } from "./utils"

const main = async () => {
    const argv = process.argv;
    let result;

    if (argv[2] === '--list-dnas' || argv[2] === '-d') {
        result = await listDnas();
    } else if (argv[2] === '--list-cell-ids' || argv[2] === '-c') {
        result = await listCellIds();
    } else if (argv[2] === '--list-active-app-ids' || argv[2] === '-a') {
        result = await listActiveAppIds();
    } else if (argv[2] === '--help' || argv[2] === '-h') {
        result = `
        
CLI tool for querying holochain over admin port (default = 4444)
    usage:
        node main.js --command
    
        -d --list-dnas calls ListDnas(void) -> [DnaHash: string]
        -c --list-cell-ids calls ListCellIds(void) -> [CellId: CellIdBase64]
        -a --list-active-app-ids calls ListActiveAppIds(void) -> [AppId: string]
        -h --help shows this help
    
    where 
        CellIdBase64 = 
            [
                DnaHashBase64: string, // base64 representation of Buffer length 39
                AgentPubKeyBase64: string // base64 representation of Buffer length 39
            ]

`;
    } else {
        result = `

No known command specified, type --help for help

`
    }

    console.log(result);
}

main()
    .then(()=> process.exit())
    .catch(e => {
        console.error(e.message);
        process.exit(1);
    });
