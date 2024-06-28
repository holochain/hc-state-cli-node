const { expect } = require('chai')
const {
  genAgentKey,
  callZome,
  dumpState,
  enableApp,
  getAppInfo,
  installApp,
  listApps,
  listEnabledApps,
  listCells,
  listDnas
} = require('./utils')

const TEST_TIMEOUT = 30_000

// NB: The ordering of the tests matters
describe('Test cli endpoints', async () => {
  let agentPubKey, firstAppDna0, firstAppDna1, secondAppDna0, secondAppDna1 // used for assertions, made globals to store values between tests
  const installedAppId0 = 'my-first-test-app'
  const installedAppId1 = 'my-second-test-app'

  it('Admin Interface: Call install first app', async () => {
    agentPubKey = (await genAgentKey()).substring(1)
    const appBundlePath = 'https://holo-host.github.io/holo-hosting-app-rsm/releases/downloads/core-app/0_6_1/core-app.0_6_1-skip-proof.happ'
    const appInstallResult = await installApp(installedAppId0, agentPubKey, appBundlePath)
    console.log('appInstallResult result : ', appInstallResult)
    expect(appInstallResult).to.be.ok

    const installed_app_id = appInstallResult.split('installed_app_id: ')[1].split("',")[0].split("'")[1].trim()
    expect(installed_app_id).to.equal(installedAppId0)

    const status = appInstallResult.split('status: ')[1].split("',")[0].split("'")[1].trim()
    expect(status.disabled)
  }).timeout(TEST_TIMEOUT)

  it('Admin Interface: Call enable first app', async () => {
    const appEnableResult = await enableApp(installedAppId0)
    console.log('appEnableResult : ', appEnableResult)
    expect(appEnableResult).to.be.ok

    // NB: enable app returns a string
    const installed_app_id = appEnableResult.split(':')[1].split("'")[0].trim()
    expect(installed_app_id).to.equal(installedAppId0)
  }).timeout(TEST_TIMEOUT)

  it('Admin Interface: Call list apps with 1 app', async () => {
    const appListString = await listApps()
    console.log('listApps result : ', appListString)
    expect(appListString).to.be.ok

    const regex = /installed_app_i(\w)+/g
    const installedAppIds = appListString.match(regex)
    expect(installedAppIds.length).to.equal(1)

    const installed_app_id = appListString.split('installed_app_id: ')[1].split("',")[0].split("'")[1].trim()
    expect(installed_app_id).to.equal(installedAppId0)

    const status = appListString.split('status: ')[1].split("',")[0].split("'")[1].trim()
    expect(status).to.equal('running')
  }).timeout(TEST_TIMEOUT)

  it('Admin Interface: Call list dnas with 1 app', async () => {
    const dnaListString = await listDnas()
    console.log('listDnas result : ', dnaListString)
    expect(dnaListString).to.be.ok

    const dnaList = dnaListString.replace(/\[|\]/g, '').split(',')
    expect(dnaList.length).to.equal(2)

    firstAppDna0 = dnaList[0].trim()
    firstAppDna1 = dnaList[1].trim()
  }).timeout(TEST_TIMEOUT)

  it('Admin Interface: Call list cells with 1 app', async () => {
	    const cellListString = await listCells()
    console.log('listCells result : ', cellListString)
    expect(cellListString).to.be.ok

    const cellList = cellListString.replace(/\[|\]/g, '').split(',').reduce((acc, currentHash, index) => {
      let cell
      if (index === 0 || index === 2) {
        // These are the dna hashes
        cell = [currentHash.trim()]
        acc.push(cell)
      } else if (index == 1) {
        cell = acc[0]
        cell.push(currentHash.trim())
      } else {
        cell = acc[1]
        cell.push(currentHash.trim())
      };
      return acc
    }, [])
    expect(cellList.length).to.equal(2)

    // NB: The dna hash lives at the 0th index of cell
    const didFindDna0 = cellList.find(c => c[0] == firstAppDna0)
    expect(didFindDna0)
    const didFindDna1 = cellList.find(c => c[0] == firstAppDna1)
    expect(didFindDna1)
  }).timeout(TEST_TIMEOUT)

  it('Admin Interface: Call dump state for app', async () => {
    const cellIdBase64 = `[${firstAppDna0},${agentPubKey}]`
    const dumpStateResult = await dumpState(cellIdBase64)
    console.log('dumpStateResult result : ', dumpStateResult)
    expect(dumpStateResult).to.be.ok
  }).timeout(TEST_TIMEOUT)

  it('Admin Interface: Call install second app', async () => {
    const appBundlePath = 'https://holo-host.github.io/holo-hosting-app-rsm/releases/downloads/core-app/0_6_2/core-app.0_6_2-skip-proof.happ'
    const appInstallResult = await installApp(installedAppId1, agentPubKey, appBundlePath)
    console.log('appInstallResult result : ', appInstallResult)
    expect(appInstallResult).to.be.ok

    const installed_app_id = appInstallResult.split('installed_app_id: ')[1].split("',")[0].split("'")[1].trim()
    expect(installed_app_id).to.equal(installedAppId1)

    const status = appInstallResult.split('status: ')[1].split("',")[0].split("'")[1].trim()
    expect(status.disabled)
  }).timeout(TEST_TIMEOUT)

  it('Call list enabled apps with 2 apps installed and 1 enabled', async () => {
    const appEnabledListString = await listEnabledApps()
    console.log('appEnabledListString result : ', typeof appEnabledListString, appEnabledListString)
    expect(appEnabledListString).to.be.ok

    const regex = /installed_app_i(\w)+/g
    const enabledAppIds = appEnabledListString.match(regex)
    expect(enabledAppIds.length).to.equal(1)

    const installed_app_id = appEnabledListString.split('installed_app_id: ')[1].split("',")[0].split("'")[1].trim()
    expect(installed_app_id).to.equal(installedAppId0)
  }).timeout(TEST_TIMEOUT)

  it('Admin Interface: Call list dnas with 2 apps and different statuses', async () => {
    const dnaListString = await listDnas()
    console.log('listDnas result : ', dnaListString)
    expect(dnaListString).to.be.ok

    const dnaList = dnaListString.replace(/\[|\]/g, '').split(',')
    expect(dnaList.length).to.equal(4)

    const secondAppDnas = dnaList.filter(d => ![firstAppDna0, firstAppDna1].includes(d))
    secondAppDna0 = secondAppDnas[0].trim()
    secondAppDna1 = secondAppDnas[1].trim()
  }).timeout(TEST_TIMEOUT)

  it('Admin Interface: Call enable second app', async () => {
    const appEnableResult = await enableApp(installedAppId1)
    console.log('appEnableResult : ', appEnableResult)
    expect(appEnableResult).to.be.ok

    const installed_app_id = appEnableResult.split(':')[1].split("'")[0].trim()
    expect(installed_app_id).to.equal(installedAppId1)
  }).timeout(TEST_TIMEOUT)

  it('Admin Interface: Call list enabled apps with 2 apps installed and enabled', async () => {
    const appEnabledListString = await listEnabledApps()
    console.log('appEnabledListString : ', appEnabledListString)
    expect(appEnabledListString).to.be.ok

    const regex = /installed_app_i(\w)+/g
    const enabledAppIds = appEnabledListString.match(regex)
    expect(enabledAppIds.length).to.equal(2)
  }).timeout(TEST_TIMEOUT)

  it('Admin Interface: Call list cells with 2 apps', async () => {
    const cellListString = await listCells()
    console.log('cellListString : ', cellListString)
    expect(cellListString).to.be.ok

    const cellList = cellListString.replace(/\[|\]/g, '').split(',').reduce((acc, currentHash, index) => {
      let cell
      if (index === 0 || index === 2 || index === 4 || index === 6) {
        // These are the dna hashes
        cell = [currentHash.trim()]
        acc.push(cell)
      } else if (index == 1) {
        cell = acc[0]
        cell.push(currentHash.trim())
      } else if (index == 3) {
        cell = acc[1]
        cell.push(currentHash.trim())
      } else if (index == 5) {
        cell = acc[2]
        cell.push(currentHash.trim())
      } else {
        cell = acc[3]
        cell.push(currentHash.trim())
      };
      return acc
    }, [])

    expect(cellList.length).to.equal(4)

    // NB: The dna hash lives at the 0th index of cell
    const didFindApp0Dna0 = cellList.find(c => c[0] == firstAppDna0)
    expect(didFindApp0Dna0)
    const didFindApp0Dna1 = cellList.find(c => c[0] == firstAppDna1)
    expect(didFindApp0Dna1)
    const didFindApp1Dna0 = cellList.find(c => c[0] == secondAppDna0)
    expect(didFindApp1Dna0)
    const didFindApp1Dna1 = cellList.find(c => c[0] == secondAppDna1)
    expect(didFindApp1Dna1)
  }).timeout(TEST_TIMEOUT)

  it('App Interface: Call app info for first app', async () => {
    const appInfoResult = await getAppInfo(installedAppId0)
    console.log('appInfoResult : ', appInfoResult)
    expect(appInfoResult).to.be.ok

    const installed_app_id = appInfoResult.split('installed_app_id: ')[1].split("',")[0].split("'")[1].trim()
    expect(installed_app_id).to.equal(installedAppId0)
  }).timeout(TEST_TIMEOUT)

  it('App Interface: Make a zome call to first app', async () => {
    const payload = null
    const zomeCallResult = await callZome(installedAppId0, firstAppDna0, agentPubKey, 'hha', 'get_happs', payload)
    console.log('zomeCallResult : ', zomeCallResult)
    expect(zomeCallResult).to.be.ok
  }).timeout(TEST_TIMEOUT)

  it('App Interface: Call app info for second app', async () => {
    const appInfoResult = await getAppInfo(installedAppId1)
    expect(appInfoResult).to.be.ok

    const installed_app_id = appInfoResult.split('installed_app_id: ')[1].split("',")[0].split("'")[1].trim()
    expect(installed_app_id).to.equal(installedAppId1)
  }).timeout(TEST_TIMEOUT)

  it('App Interface: Make a zome call to second app', async () => {
    const payload = null
    const zomeCallResult = await callZome(installedAppId1, secondAppDna0, agentPubKey, 'hha', 'get_happs', payload)
    console.log('zomeCallResult : ', zomeCallResult)
    expect(zomeCallResult).to.be.ok
  }).timeout(TEST_TIMEOUT)
})
