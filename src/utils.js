
import { ADMIN_PORT } from "./config";
import { AdminWebsocket } from "@holochain/conductor-api";

export const listDnas = async () => {
    try {
        const adminWebsocket = await AdminWebsocket.connect(
            `ws://localhost:${ADMIN_PORT}`
        );

        console.log(`Successfully connected to admin interface on port ${ADMIN_PORT}`);

        return await adminWebsocket.listDnas();
    } catch(e) {
        console.log(`Error while calling ListDnas: ${e.message}.`);
        return null;
    }
}

export const listCellIds = async () => {
    try {
        const adminWebsocket = await AdminWebsocket.connect(
            `ws://localhost:${ADMIN_PORT}`
        );

        return await adminWebsocket.listCellIds();
    } catch(e) {
        console.log(`Error while calling ListDnas: ${e.message}.`);
        return null;
    }
}

export const listActiveAppIds = async () => {
    try {
        const adminWebsocket = await AdminWebsocket.connect(
            `ws://localhost:${ADMIN_PORT}`
        );

        return await adminWebsocket.listActiveAppIds();
    } catch(e) {
        console.log(`Error while calling ListDnas: ${e.message}.`);
        return null;
    }
}
