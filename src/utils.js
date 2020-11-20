
import { ADMIN_PORT } from "./config";
import { AdminWebsocket } from "@holochain/conductor-api";

export const ListDnas = async () => {
    try {
        const adminWebsocket = await AdminWebsocket.connect(
            `ws://localhost:${ADMIN_PORT}`
        );

        return await adminWebsocket.ListDnas();
    } catch(e) {
        console.log(`Error while calling ListDnas: ${e.message}.`);
        return null;
    }
}
