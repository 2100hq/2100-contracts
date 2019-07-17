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
    let userPreBalance
    let depositRequestAmount
    let minDeposit
    let depositedAmount
    let depositTx

    before(async () => {
      console.log('minting for user')
      const mintTx = await dai.mint.sendTransaction(
        web3.utils.toWei('9.99', 'ether'),
        {from: user}
      )
      console.log('minted', toDAI(mintTx.receipt.logs[0].args.wad))
      userPreBalance = await dai.balanceOf.call(user)
      depositRequestAmount = userPreBalance.div(new BN(2))
      minDeposit = await controller.minDeposit.call()
      depositedAmount = depositRequestAmount.sub(
        depositRequestAmount.mod(minDeposit)
      )
    })

    it('should not allow deposit before allowance', async () => {
      assert(
        (await dai.allowance.call(user, controller.address)).isZero(),
        'Controller allowance should not be set'
      )
      const amount = await dai.balanceOf.call(user)
      assert(amount.gt(0), 'User DAI balance should not be 0')
      try {
        await controller.deposit(amount, {from: user})
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
      assert(
        depositRequestAmount.gt(0),
        'User must have greater than 0 balance'
      ) // sanity check mint occured
      console.log()
      console.log('approving', toDAI(depositRequestAmount))
      const approveTx = await dai.approve(
        controller.address,
        depositRequestAmount,
        {from: user}
      )
      console.log()
      console.log('approved', toDAI(approveTx.receipt.logs[0].args.wad))

      console.log(
        'current allowance',
        user,
        controller.address,
        toDAI(await dai.allowance.call(user, controller.address))
      )
      assert(
        (await dai.allowance.call(user, controller.address)).eq(
          depositRequestAmount
        ),
        'Controller allowance should be set'
      )
      console.log()
      console.log('depositing')
      try {
        depositTx = await controller.deposit(depositRequestAmount, {from: user})
        console.log('done depositing')
      } catch (error) {
        console.log(error)
        assert.notOk(error, `Should not error but got: ${error.message}`)
      }
    })

    it('should perform deposit calculations correctly', async () => {
      assert(
        (await dai.balanceOf.call(controller.address)).eq(depositedAmount),
        'Controller does not have correct DAI balance.'
      )

      assert(
        (await controller.balanceOf.call(user)).eq(depositedAmount),
        'User is not credited correctly'
      )

      assert(
        (await dai.balanceOf.call(user)).eq(
          userPreBalance.sub(depositedAmount)
        ),
        'User should have correct remaining DAI balance'
      )
    })

    it('should emit correctly', () => {
      assert(depositTx.logs, 'Should produce logs')
      const depositEvent = depositTx.logs.find(l => l.event === 'Deposit')
      assert(depositEvent, 'Should emit a deposit event')
      assert(
        depositEvent.args.account === user,
        'User should be the account in the Deposit event'
      )
      assert(
        depositEvent.args.amount.eq(depositedAmount),
        'Deposited amount should match event'
      )
      assert(
        depositEvent.args.balance.eq(depositedAmount),
        'User balance should match event'
      )
    })
  })
})
