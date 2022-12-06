# hc-state CLI

CLI tool for querying holochain over admin port (default = 4444) or app port (default = 42233)
```
usage:
    hc-state --command arg

    Commands:
        listApps|a                                                                  list all installed apps: calls listApps({status_filter: null}) -> [AppInfo: any]
        installAppBundle|b [options] <InstalledAppId> <AgentHash> <AppBundleSource> install provided happ bundle with given id and details:
                                                                                        calls InstallAppBundle(
                                                                                            installed_app_id,
                                                                                            agent_key,
                                                                                            source,
                                                                                            membrane_proofs?,
                                                                                            uid?) -> {
                                                                                                installed_app_id,
                                                                                                cell_data: [ { cell_id, cell_nick } ],
                                                                                                status: { inactive: { reason: [Object] } }
                                                                                            }
        listCellIds|c                                                               list installed cells IDs: calls listCellIds(void) -> [CellId: CellIdBase64]
        listDnas|d                                                                  list installed DNAs: calls ListDnas(void) -> [DnaHash: string]
        listEnabledApps|e                                                           list enabled apps: calls listApps({status_filter: "enabled"}) -> [AppInfo: any]
        stateDump|s <CellIdBase6>                                                   dump chain state for app: calls dumpState(CellIdBase64 | Index) -> [stateDump: any]
        activateApp|o <InstalledAppId>                                              activate provided app bundle: calls activateApp(installed_app_id) -> void
        appInfo|i <InstalledAppId>                                                   print app info for app:
                                                                                        calls appInfo(installed_app_id) -> {
                                                                                            installed_app_id: string,
                                                                                            cell_data: [{cell_id: CellIdBase64, cell_nick: string}],
                                                                                            active: boolean
                                                                                        }
        zomeCall|z <DnaHash> <AgentHash> <ZomeName> <ZomeFunction> <Payload>         call zome function for cell:
                                                                                        calls callZome(
                                                                                            cell_id,
                                                                                            zome_name,
                                                                                            fn_name,
                                                                                            payload,
                                                                                            provenence) -> ZomeCallResult: any
        help [command]                                                               display help for command



    Options:
        -V, --version               output the version number
        -p, --app-port <port>       assigns app port for outbound app-interface calls (default: 42233)
        -m, --admin-port <port>     assigns admin port for outbond admin-interface calls (default: 4444)
        -h, --help                  display help for command

        where
            CellIdBase64 =
            [
                DnaHashBase64: string, // base64 representation of Buffer length 39
                AgentPubKeyBase64: string // base64 representation of Buffer length 39
            ]

        example
            hc-state s "['hC0kqcfqvJ8krBR0bNnPsmLtFiEiMOHM0fX+U8FW+ROc7P10tUdc','hCAkcIRv7RZNVg8FWc6/oJZo04dZTXm7JP6tfMk3RptPY02cBQac']"
            // arg is the CellIdBase64 as a continuous string (should not contain spaces)
            or
            hc-state s 0
            // arg is the numeric index of cell ID returned by ListCellIds
```

#### Build
```sh
npm i
npm run build
```
will build `main.js` into `dist/`

#### Prerequisites
`node 12.x`
