const Controller = artifacts.require('Controller')
const SafeMath = artifacts.require('./libraries/SafeMath')
const DummyDAI = artifacts.require('./test/DummyDAI')

async function getDAIAddress (network) {
  if (/artax/.test(network) && process.env.ARTAX_DAI_ADDRESS) {
    return (await DummyDAI.at(process.env.ARTAX_DAI_ADDRESS.toLowerCase()))
      .address // will throw if does not exist
  }
  if (/ganache|dev|test|artax/.test(network)) {
    return (await DummyDAI.deployed()).address
  }
  throw new Error('Public Network DAI address not implemented')
}

module.exports = async function (deployer, network, accounts) {
  const daiAddress = await getDAIAddress(network)

  await deployer.deploy(SafeMath)

  await deployer.link(SafeMath, Controller)

  await deployer.deploy(Controller, daiAddress)

  const controller = await Controller.deployed()

  console.log()
  console.log('CONTROLLER ADDRESS', controller.address)
  console.log('owner', await controller.owner())
}
