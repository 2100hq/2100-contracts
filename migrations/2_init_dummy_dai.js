const DummyDAI = artifacts.require('./test/DummyDAI')
const SafeMath = artifacts.require('./libraries/SafeMath')
module.exports = async function (deployer, network, accounts) {
  if (/artax/.test(network) && process.env.ARTAX_DAI_ADDRESS) {
    ;(await DummyDAI.at(process.env.ARTAX_DAI_ADDRESS.toLowerCase())).address // will throw if does not exist
    return console.log('Dummy DAI already deployed')
  }
  if (!/ganache|dev|test|artax/.test(network)) {
    return console.log('Skipping Dummy DAI on', network)
  }
  deployer.deploy(DummyDAI).then(async () => {
    await deployer.deploy(SafeMath)
    await deployer.link(SafeMath, DummyDAI)
    const dai = await DummyDAI.deployed()
    console.log()
    console.log('DUMMY DAI ADDRESS', dai.address)
  })
}
