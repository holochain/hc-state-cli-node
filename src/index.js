import { ADMIN_PORT } from "./config";
import { AdminWebsocket } from "@holochain/conductor-api";

const getAdminWebsocket = async () => {
    console.log(`Connecting to holochain`);
    const adminWebsocket = await AdminWebsocket.connect(
        `ws://localhost:${ADMIN_PORT}`
    );
    console.log(`Successfully connected to admin interface on port ${ADMIN_PORT}`);
    return adminWebsocket;
}

const main = async () => {
    const argv = process.argv;
    let result, context = "";

    if (argv[2] === '--list-dnas' || argv[2] === '-d') {
        const adminWebsocket = await getAdminWebsocket();
        context = `Installed DNAs:`;
        result = await adminWebsocket.listDnas();
        if (Array.isArray(result)) 
            result = result.map(dna => dna.toString('base64'));
    } else if (argv[2] === '--list-cell-ids' || argv[2] === '-c') {
        const adminWebsocket = await getAdminWebsocket();
        context = `Installed CellIds:`;
        result = await adminWebsocket.listCellIds();
        if (Array.isArray(result)) 
            result = result.map(cell_id => [cell_id[0].toString('base64'), cell_id[1].toString('base64')]);
    } else if (argv[2] === '--list-active-app-ids' || argv[2] === '-a') {
        const adminWebsocket = await getAdminWebsocket();
        context = `Active App Ids:`;
        result = await adminWebsocket.listActiveAppIds();
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

    console.log(context);
    console.log(result);
}

main()
    .then(()=> process.exit())
    .catch(e => {
        console.error(e.message);
        process.exit(1);
    });
