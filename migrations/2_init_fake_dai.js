const FakeDAI = artifacts.require("./test/FakeDAI")
module.exports = function(deployer, network, accounts) {
  if (!/ganache|dev|test/.test(network)) {
    return console.log("Skipping Fake DAI on", network)
  }
  deployer.deploy(FakeDAI).then(async () =>{
    const dai = await FakeDAI.deployed()
    console.log();
    console.log('DAI ADDRESS', dai.address);

    console.log('MINTING FOR', accounts[0], (await dai.mint.sendTransaction({ from: accounts[0]})))
    console.log('balanceOf',accounts[0], (await dai.balanceOf(accounts[0])).toString())
    console.log('MINTING FOR', accounts[1], (await dai.mint.sendTransaction({ from: accounts[1]})))
    console.log('balanceOf',accounts[1], (await dai.balanceOf(accounts[0])).toString())
  });
};
