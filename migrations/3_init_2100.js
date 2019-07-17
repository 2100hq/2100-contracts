const Controller = artifacts.require('Controller')
const SafeMath = artifacts.require('./libraries/SafeMath')
const ECDSA = artifacts.require('./libraries/ECDSA')
const DummyDAI = artifacts.require('./test/DummyDAI')
module.exports = async function (deployer, network, accounts) {
  const dai = await DummyDAI.deployed()

  await deployer.deploy(SafeMath)
  await deployer.link(SafeMath, Controller)
  await deployer.deploy(ECDSA)
  await deployer.link(ECDSA, Controller)

  await deployer.deploy(Controller, dai.address)

  const controller = await Controller.deployed()

  console.log()
  console.log('CONTROLLER ADDRESS', controller.address)
  console.log('owner', await controller.owner())
}
