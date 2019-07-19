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

  describe('Withdraw', () => {
    let userPre2100Balance
    let userPreDaiBalance
    let controllerPreDaiBalance
    let withdrawRequestAmount
    let withdrawTx
    before(async () => {
      userPre2100Balance = await controller.balanceOf.call(user)
      userPreDaiBalance = await dai.balanceOf.call(user)
      withdrawRequestAmount = userPre2100Balance
      controllerPreDaiBalance = await dai.balanceOf.call(controller.address)
    })
    it('should prevent owner from withdrawing', async () => {
      let error
      try {
        await controller.withdraw(new BN(1))
      } catch (e) {
        error = e
      }
      assert(error, 'Should error')
      assert(
        new RegExp(errTypes.ControllerNotOwner).test(error.message),
        `Should error with ${errTypes.ControllerNotOwner}; Got ${error.message}`
      )
    })
    it('should prevent overdrawing funds', async () => {
      const amount = userPre2100Balance.add(new BN(1))
      let error
      try {
        await controller.withdraw(amount, {from: user})
      } catch (e) {
        error = e
      }
      assert(error, 'Should error')
      assert(
        new RegExp(errTypes.SenderInsufficentFunds).test(error.message),
        `Should error with ${errTypes.SenderInsufficentFunds}; Got ${
          error.message
        }`
      )
    })
    it('should allow withdrawing funds correctly', async () => {
      try {
        withdrawTx = await controller.withdraw(withdrawRequestAmount, {
          from: user
        })
      } catch (error) {
        assert.notOk(error, `Should not error but got ${error.message}`)
      }
    })
    it('should perform correct calculations', async () => {
      let userPostDaiBalance = await dai.balanceOf.call(user)
      let userPost2100Balance = await controller.balanceOf.call(user)
      let controllerPostDaiBalance = await dai.balanceOf.call(
        controller.address
      )
      let userDaiDiff = userPreDaiBalance.add(withdrawRequestAmount)
      let controllerDaiDiff = controllerPreDaiBalance.sub(withdrawRequestAmount)
      let user2100Diff = userPre2100Balance.sub(withdrawRequestAmount)
      assert(
        userPostDaiBalance.eq(userDaiDiff),
        'User DAI balance is not correct'
      )
      assert(
        controllerPostDaiBalance.eq(controllerDaiDiff),
        'Controller DAI balance is not correct'
      )
      assert(
        userPost2100Balance.eq(user2100Diff),
        'User 2100 balance is not correct'
      )
    })

    it('should emit correctly', () => {
      assert(withdrawTx.logs, 'Should produce logs')
      const event = withdrawTx.logs.find(l => l.event === 'Withdraw')
      assert(event, 'Should emit a withdraw event')
      assert(
        event.args.account === user,
        'User should be the account in the Deposit event'
      )
      assert(
        event.args.amount.eq(withdrawRequestAmount),
        'Withdrawn amount should match event'
      )
      assert(
        event.args.balance.eq(userPre2100Balance.sub(withdrawRequestAmount)),
        'User balance should match event'
      )
    })
  })
})
