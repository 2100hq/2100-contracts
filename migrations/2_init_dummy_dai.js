const DummyDAI = artifacts.require('./test/DummyDAI')
const SafeMath = artifacts.require('./libraries/SafeMath')
module.exports = function (deployer, network, accounts) {
  if (!/ganache|dev|test/.test(network)) {
    return console.log('Skipping Fake DAI on', network)
  }
  const isTestingNetwork = /test/.test(network)

  deployer.deploy(DummyDAI).then(async () => {
    await deployer.deploy(SafeMath)
    await deployer.link(SafeMath, DummyDAI)
    const dai = await DummyDAI.deployed()
    if (isTestingNetwork) return
    console.log()
    console.log('DAI ADDRESS', dai.address)

    console.log(
      'MINTING FOR accounts[0]',
      accounts[0],
      (await dai.mint.sendTransaction({ from: accounts[0] })).receipt.logs.map(
        l => l.event
      )
    )
    console.log(
      'balanceOf',
      accounts[0],
      (await dai.balanceOf(accounts[0])).toString()
    )
    console.log(
      'MINTING FOR accounts[1]',
      accounts[1],
      (await dai.mint.sendTransaction({ from: accounts[1] })).receipt.logs.map(
        l => l.event
      )
    )
    console.log(
      'balanceOf',
      accounts[1],
      (await dai.balanceOf(accounts[0])).toString()
    )
  })
}
