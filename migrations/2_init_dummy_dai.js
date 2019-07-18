const DummyDAI = artifacts.require('./test/DummyDAI')
const SafeMath = artifacts.require('./libraries/SafeMath')
module.exports = function (deployer, network, accounts) {
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
