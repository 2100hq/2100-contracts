const Controller = artifacts.require('Controller')
const DummyDAI = artifacts.require('DummyDAI')

const errTypes = require('../utils/err-types')

const BN = web3.utils.BN

contract('Controller', accounts => {
  let controller
  let dai
  let owner = accounts[0]
  let user = accounts[1]

  before(async () => {
    controller = await Controller.deployed()
    dai = await DummyDAI.deployed()
  })

  describe('Deposit', () => {
    let userPreDaiBalance
    let depositRequestAmount
    let minDeposit
    let depositedAmount
    let depositTx

    before(async () => {
      const mintTx = await dai.mint.sendTransaction(
        web3.utils.toWei('9.99', 'ether'),
        {from: user}
      )

      userPreDaiBalance = await dai.balanceOf.call(user)
      depositRequestAmount = userPreDaiBalance.div(new BN(2))
      minDeposit = await controller.minDeposit.call()
      depositedAmount = depositRequestAmount.sub(
        depositRequestAmount.mod(minDeposit)
      )
    })
    it('should prevent owner from depositing', async () => {
      let error
      try {
        await controller.deposit(new BN(1))
      } catch (e) {
        error = e
      }
      assert(error, 'Should error')
      assert(
        new RegExp(errTypes.ControllerNotOwner).test(error.message),
        `Should error with ${errTypes.ControllerNotOwner}; Got ${error.message}`
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

      const approveTx = await dai.approve(
        controller.address,
        depositRequestAmount,
        {from: user}
      )

      assert(
        (await dai.allowance.call(user, controller.address)).eq(
          depositRequestAmount
        ),
        'Controller allowance should be set'
      )

      try {
        depositTx = await controller.deposit(depositRequestAmount, {from: user})
      } catch (error) {
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
          userPreDaiBalance.sub(depositedAmount)
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
