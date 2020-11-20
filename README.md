# hc-state CLI

CLI tool for querying holochain over admin port
```
usage:
    node main.js --command

    -d --list-dnas calls listDnas(void) -> [DnaHash: string]
    -c --list-cell-ids calls listCellIds(void) -> [CellId: CellIdBase64]
    -a --list-active-app-ids calls listActiveAppIds(void) -> [AppId: string]
    -h --help shows this help

where 
    CellIdBase64 = 
        [
            DnaHashBase64: string, // base64 representation of Buffer length 39
            AgentPubKeyBase64: string // base64 representation of Buffer length 39
        ]
```

useful in the future:
```
    -s --dump-state calls DumpState(cell_id: CellIdBase64) -> any
```
It would also be useful to have `appDetails(app_id)`, but currently holochain admin API does not expose this functionality

#### Build
```sh
yarn install
yarn run build
```
will build `main.js` into `dist/`

#### Prerequisites
`node 12.x`
