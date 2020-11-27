import { ADMIN_PORT } from "./config";
import { AdminWebsocket } from "@holochain/conductor-api";

let adminWebsocket;

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
        'signature': true,
        'header_address': true,
        'author': true,
        'prev_header': true,
        'base_address': true,
        'target_address': true,
        'tag': true,
        'entry_hash': true,
        'entry': true,
        'hash': true
    };

    if (Array.isArray(obj) || (typeof obj === 'object' && obj !== null)) {
        for (const i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (buffer_keys[i] && Array.isArray(obj[i])) {
                    obj[i] = Buffer.from(obj[i]).toString('base64');
                } else {
                    obj[i] = stringifyBuffRec(obj[i]);
                }
            }
        }
    }

    return obj;
}

/**
 * Creates and returns websocket connection to admin interface of Holochain
 * @returns {AdminWebsocket}
 */
const getAdminWebsocket = async () => {
    if (adminWebsocket) return adminWebsocket;

    console.log(`Connecting to holochain`);
    adminWebsocket = await AdminWebsocket.connect(
        `ws://localhost:${ADMIN_PORT}`
    );
    console.log(`Successfully connected to admin interface on port ${ADMIN_PORT}`);
    return adminWebsocket;
}

/**
 * Lists array of all the installed DNAs in base64 format
 * @returns {Array}
 */
export const listDnas = async () => {
    const adminWebsocket = await getAdminWebsocket();
    let result = await adminWebsocket.listDnas();

    if (Array.isArray(result))
        result = result.map(dna => dna.toString('base64'));

    return result;
}

/**
 * Lists array of all created cell ids in a format [DnaHashBase64, AgentPubKeyBase64]
 * @returns {Array}
 */
export const listCellIds = async () => {
    const adminWebsocket = await getAdminWebsocket();
    let result = await adminWebsocket.listCellIds();

    if (Array.isArray(result))
        result = result.map(cell_id => [cell_id[0].toString('base64'), cell_id[1].toString('base64')]);

    return result;
}

/**
 * Lists array of all active apps
 * @returns {Array}
 */
export const listActiveApps = async () => {
    const adminWebsocket = await getAdminWebsocket();
    return await adminWebsocket.listActiveApps();
}

/**
 * Dumps state of holochain for given cell id in a pretty format
 * @param {CellID | int} cellIdArg
 * @returns string
 */
export const dumpState = async (cellIdArg) => {
    if (!cellIdArg) return `Error: No cell_id passed.`;

    let cellId;

    const index = parseInt(cellIdArg);
    if (`${index}` == cellIdArg) {
        // arg is a index so get cell ID list from conductor
        const adminWebsocket = await getAdminWebsocket();
        let result = await adminWebsocket.listCellIds();
        if (Array.isArray(result)) {
            if (index >= result.length) {
                return `CellId index (zero based) provided was ${index}, but there are only ${result.length} cell(s)`;
            }
            cellId = result[index];
        } else {
            return `Expected array from listCellIds() got: ${result}`;
        }
    } else {
        // Convert console.log output format into JSON format so that it can be parsed
        cellIdArg = cellIdArg.replace(/'/g, '"');


        try {
            cellId = JSON.parse(cellIdArg);
            if (Array.isArray(cellId)) {
                cellId[0] = Buffer.from(cellId[0], 'base64');
                cellId[1] = Buffer.from(cellId[1], 'base64');
            } else {
                return `Error parsing cell_id: cell_id should be an array [DnaHashBase64, AgentPubKeyBase64]`;
            }
        } catch (e) {
            return `Error parsing cell_id: ${e}`;
        }
    }

    const adminWebsocket = await getAdminWebsocket();
    const stateDump = await adminWebsocket.dumpState({
        cell_id: cellId
    });
    // Replace all the buffers with byte64 representations
    let result = stringifyBuffRec(stateDump);
    return JSON.stringify(result, null, 4)+`\n\n${stateDump.length} Elements in dump`;
}
