// const fetch = require('node-fetch');
const util = require('util')
const exec = util.promisify(require('child_process').exec)

exports.wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// HC Sandbox Call:
exports.genAgentKey = async (installedAppId, agentPubkey, appBundlePath) => {
  console.log('\n  Calling hc sandbox to generate fresh agent.')
  try {
    const { stdout, stderr } = await exec('echo "" | hc s --piped call new-agent')
    console.log(stderr)
    const agentPubkey = stdout.split('Added agent ')[1].trim()
    console.log(` 🔎 Generated new agent with pubkey: ${agentPubkey}`)
    return agentPubkey
  } catch (e) {
    throw new Error(e.stdout)
  }
}

// Admin Interface Calls:
exports.installApp = async (installedAppId, agentPubkey, appBundlePath) => {
  console.log(`\n  Intalling test app with id ${installedAppId}, agent key ${agentPubkey}, and app path ${appBundlePath}`)
  try {
    const { stdout, stderr } = await exec(`node dist/main.js b ${installedAppId} ${agentPubkey} ${appBundlePath} -m 8888`)
    console.log(stderr)
    const installedResult = stdout.split('Installed App Bundle:')[1].trim()
    console.log(` 🔎 Installed app with id ${installedAppId}`)
    return installedResult
  } catch (e) {
    throw new Error(e.stdout)
  }
}

exports.enableApp = async (installedAppId) => {
  console.log(`\n  Enabling test app with id ${installedAppId}`)
  try {
    const { stdout, stderr } = await exec(`node dist/main.js o ${installedAppId} -m 8888`)
    console.log(stderr)
    const enabledResult = stdout.split('Enabled App with ID')[1].trim()
    console.log(` 🔎 Enabled app with id ${installedAppId}`)
    return enabledResult
  } catch (e) {
    throw new Error(e.stdout)
  }
}

exports.listApps = async () => {
  console.log('\n  Getting the list of all apps on the conductor')
  try {
    const { stdout, stderr } = await exec('node dist/main.js a -m 8888')
    console.log(stderr)
    const listAppsResult = stdout.split('Installed Apps:')[1].trim()
    console.log(' 🔎 Got the list of apps')
    return listAppsResult
  } catch (e) {
    throw new Error(e.stdout)
  }
}

exports.listEnabledApps = async () => {
  console.log('\n  Getting the list of enabled apps on the conductor')
  try {
    const { stdout, stderr } = await exec('node dist/main.js e -m 8888')
    console.log(stderr)
    const listEnabledAppsResult = stdout.split('Enabled Apps:')[1].trim()
    console.log(' 🔎 Got the list of enabled apps')
    return listEnabledAppsResult
  } catch (e) {
    throw new Error(e.stdout)
  }
}

exports.listDnas = async () => {
  console.log('\n  Getting the list of dnas on the conductor')
  try {
    const { stdout, stderr } = await exec('node dist/main.js d -m 8888')
    console.log(stderr)
    const listDnasResult = stdout.split('Installed DNAs:')[1].trim()
    console.log(' 🔎 Got the list of dnas')
    return listDnasResult
  } catch (e) {
    throw new Error(e.stdout)
  }
}

exports.listCells = async () => {
  console.log('\n  Getting the list of cells on the conductor')
  try {
    const { stdout, stderr } = await exec('node dist/main.js c -m 8888')
    console.log(stderr)
    const listCellsResult = stdout.split('Installed CellIds:')[1].trim()
    console.log(' 🔎 Got the list of cells')
    return listCellsResult
  } catch (e) {
    throw new Error(e.stdout)
  }
}

exports.dumpState = async (CellIdBase64) => {
  console.log(`\n  Dump state for app with id ${CellIdBase64}`)
  try {
    const { stdout, stderr } = await exec(`node dist/main.js s ${CellIdBase64} -m 8888`, { timeout: 180000 })
    console.log(stderr)
    const stateDumpResult = stdout.split('State Dump for App:')[1].trim()
    console.log(` 🔎 Dumped state for app with CellIdBase64: ${CellIdBase64}`)
    return stateDumpResult
  } catch (e) {
    throw new Error(e.stdout)
  }
}

// App Interface Calls:
exports.getAppInfo = async (installedAppId) => {
  console.log(`\n  Getting app info for app with id ${installedAppId}`)
  try {
    const { stdout, stderr } = await exec(`node dist/main.js i ${installedAppId} -m 8888`)
    console.log(stderr)
    const appInfoResult = stdout.split('AppInfo Details for App:')[1].trim()
    console.log(` 🔎 Got app info for id ${installedAppId}`)
    return appInfoResult
  } catch (e) {
    throw new Error(e.stdout)
  }
}

exports.callZome = async (installedAppId, AppDnaHash, agentPubkey, zomeName, fnName, payload) => {
  console.log(`\n  Making zome call for app with id ${installedAppId}`)
  try {
    const { stdout, stderr } = await exec(`node dist/main.js z ${installedAppId} ${AppDnaHash} ${agentPubkey} ${zomeName} ${fnName} ${payload} -m 8888`)
    console.log(stderr)
    const zomeCallResult = stdout.split('Zome Call Result :')[1].trim()
    console.log(` 🔎 Made zome call for app with id ${installedAppId}`)
    return zomeCallResult
  } catch (e) {
    throw new Error(e.stdout)
  }
}
