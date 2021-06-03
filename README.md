# hc-state CLI

CLI tool for querying holochain over admin port
```
usage:
    hc-state --command arg

    Commands:
        listDnas|d                  list installed DNAs: calls ListDnas(void) -> [DnaHash: string]
        listCellIds|c               list installed cells IDs: calls listCellIds(void) -> [CellId: CellIdBase64]
        listActiveApps|a            list active app IDs: calls listActiveApps(void) -> [AppId: string]
        stateDump|s <CellIdBase6>   dump chain state for app: calls dumpState(CellIdBase64 | Index) -> [stateDump: any]
        appInfo|i <InstalledAppId>  print app info for app: calls appInfo(InstalledAppId) -> { installed_app_id: string, cell_data: [{cell_id: CellIdBase64,
                                    cell_nick: string}], active: boolean}
        help [command]              display help for command

    
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
            hc-state s "['hC0kqcfqvJ8krBR0bNnPsmLtFiEiMOHM0fX+U8FW+ROc7P10tUdc','hCAkcIRv7RZNVg8FWc6/oJZo04dZTXm7JP6tfMk3RptPY02cBQac'] 
            // arg is the CellIdBase64 as a continuous string (should not contain spaces)
            or 
            hc-state s 0 
            // arg is the numeric index of cell ID returned by ListCellIds
```

It would be useful to have `appDetails(app_id)`, but currently holochain admin API does not expose this functionality

#### Build
```sh
npm i
npm run build
```
will build `main.js` into `dist/`

#### Prerequisites
`node 12.x`
