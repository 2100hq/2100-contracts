const Controller = artifacts.require('Controller')
const SafeMath = artifacts.require('./libraries/SafeMath')
const ECDSA = artifacts.require('./libraries/ECDSA')
const DummyDAI = artifacts.require('./test/DummyDAI')

async function getDAIAddress (network) {
  if (/ganache|dev|test|artax/.test(network)) {
    return (await DummyDAI.deployed()).address
  }
  throw new Error('Public Network DAI address not implemented')
}

module.exports = async function (deployer, network, accounts) {
  const daiAddress = await getDAIAddress(network)

  await deployer.link(SafeMath, Controller)
  await deployer.deploy(ECDSA)
  await deployer.link(ECDSA, Controller)

  await deployer.deploy(Controller, daiAddress)

  const controller = await Controller.deployed()

  console.log()
  console.log('CONTROLLER ADDRESS', controller.address)
  console.log('owner', await controller.owner())
}
