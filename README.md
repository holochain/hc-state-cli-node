# hc-state CLI

CLI tool for querying holochain over admin port
```
usage:
        hc-state --command arg

        -a --list-active-app-ids (no arg) calls ListActiveAppIds(void) -> [AppId: string]
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
```

It would be useful to have `appDetails(app_id)`, but currently holochain admin API does not expose this functionality

#### Build
```sh
yarn install
yarn run build
```
will build `main.js` into `dist/`

#### Prerequisites
`node 12.x`
