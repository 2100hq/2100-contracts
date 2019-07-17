const Controller = artifacts.require('Controller')
const DummyDAI = artifacts.require('DummyDAI')
const BN = web3.utils.BN
const errTypes = {
  PREFIX: 'VM Exception while processing transaction: ',
  revert: 'revert',
  outOfGas: 'out of gas',
  invalidJump: 'invalid JUMP',
  invalidOpcode: 'invalid opcode',
  stackOverflow: 'stack overflow',
  stackUnderflow: 'stack underflow',
  staticStateChange: 'static state change',
  SafeMathSubOverflow: 'SafeMath: subtraction overflow',
  ControllerAllowance: 'Controller does not have enough allowance granted'
}

function toDAI (amount) {
  return web3.utils.fromWei(amount.toString()) + ' DAI'
}

contract('Controller', accounts => {
  let controller
  let dai
  let owner = accounts[0]
  let user = accounts[1]
  before(async () => {
    controller = await Controller.deployed()
    dai = await DummyDAI.deployed()
    console.log('minting for user')
    const tx0 = await dai.mint.sendTransaction(
      web3.utils.toWei('9.99', 'ether'),
      { from: user }
    )
    console.log('minted', toDAI(tx0.receipt.logs[0].args.wad))
  })
  describe('Deploy', () => {
    it('should set variables correctly', async () => {
      assert.equal(
        await controller.owner.call(),
        owner,
        'Owner is not deployer'
      )
      assert.equal(
        await controller.DAI.call(),
        dai.address,
        'Dai address incorrect'
      )
      assert(
        (await dai.balanceOf.call(controller.address)).isZero(),
        'Controller has DAI balance'
      )
    })
  })

  describe('Deposit', () => {
    it('should not allow deposit before allowance', async () => {
      assert(
        (await dai.allowance.call(user, controller.address)).isZero(),
        'Controller allowance should not be set'
      )
      const amount = await dai.balanceOf.call(user)
      assert(amount.gt(0), 'User DAI balance should not be 0')
      try {
        await controller.deposit(amount, { from: user })
        throw null
      } catch (error) {
        assert(error, 'Should error')
        assert(
          new RegExp(errTypes.ControllerAllowance).test(error.message),
          `Should error with ${errTypes.ControllerAllowance}; Got ${
            error.message
          }`
        )
      }
    })
    it('should allow deposit after allowance', async () => {
      let userPreBalance = await dai.balanceOf.call(user)
      let amount = userPreBalance.div(new BN(2))
      assert(amount.gt(0), 'User must have greater than 0 balance')
      console.log()
      console.log('approving', toDAI(amount))
      const tx1 = await dai.approve(controller.address, amount, { from: user })
      console.log()
      console.log('approved', toDAI(tx1.receipt.logs[0].args.wad))

      console.log(
        'current allowance',
        user,
        controller.address,
        toDAI(await dai.allowance.call(user, controller.address))
      )
      assert(
        (await dai.allowance.call(user, controller.address)).eq(amount),
        'Controller allowance should be set'
      )
      console.log()
      console.log('depositing')

      const tx = await controller.deposit(amount, { from: user })
      console.log('done depositing')

      const minDeposit = new BN(10).pow(new BN(16))
      const flooredAmount = amount.sub(amount.mod(minDeposit))

      assert(
        (await dai.balanceOf.call(controller.address)).eq(flooredAmount),
        'Controller does not have correct DAI balance.'
      )

      assert(
        (await controller.balanceOf.call(user)).eq(flooredAmount),
        'User is not credited correctly'
      )

      assert(
        (await dai.balanceOf.call(user)).eq(userPreBalance.sub(flooredAmount)),
        'User should have correct remaining DAI balance'
      )
    })
    it('should do calculations correctly')
  })
})
