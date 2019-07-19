const Controller = artifacts.require('Controller')
const DummyDAI = artifacts.require('DummyDAI')
const UsernameToken = artifacts.require('UsernameToken')
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
  ControllerAllowance: 'Controller does not have enough allowance granted',
  SenderInsufficentFunds: 'Sender has insufficent funds',
  ControllerNotOwner: 'Owner cannot call this function',
  ValidatorMessageProcessed: 'this message has aleady been process',
  ValidatorSigInvalid: 'invalid signature',
  MessageIdInvalid: 'messageId is invalid'
}
const {getCreateMessageId, getSignature} = require('./utils/signing')

function toDAI (amount) {
  return web3.utils.fromWei(amount.toString()) + ' DAI'
}

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

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

  describe('Create', () => {
    const username = '2100hq'
    let createTx
    let hash
    let signature
    before(async () => {
      hash = getCreateMessageId(username)
      signature = await getSignature(hash, owner)
    })
    it('getCreateMessageId should match web3.js signing', async () => {
      assert.equal(
        getCreateMessageId(username),
        await controller.getCreateMessageId(username)
      )
    })
    it('should not allow invalid signatures', async () => {
      let error
      const {v, r, s} = await getSignature(hash, user)
      try {
        createTx = await controller.create(username, hash, v, r, s, {
          from: user
        })
      } catch (e) {
        error = e
      }
      assert(error, 'Should error')
      assert(
        new RegExp(errTypes.ValidatorSigInvalid).test(error.message),
        `Should error with ${errTypes.ValidatorSigInvalid}; Got ${
          error.message
        }`
      )
    })
    it('should not allow invalid messageId', async () => {
      let error
      const {v, r, s} = signature
      try {
        createTx = await controller.create('somename', hash, v, r, s, {
          from: user
        })
      } catch (e) {
        error = e
      }
      assert(error, 'Should error')
      assert(
        new RegExp(errTypes.MessageIdInvalid).test(error.message),
        `Should error with ${errTypes.MessageIdInvalid}; Got ${error.message}`
      )
    })
    it('creates token contract when signature message is valid, has not been seen, token does not exist, username is not on blacklist', async () => {
      assert.equal(
        await controller.usernameToToken.call(username),
        NULL_ADDRESS
      )
      const {v, r, s} = signature
      try {
        createTx = await controller.create(username, hash, v, r, s, {
          from: user
        })
      } catch (e) {
        assert.notOk(e, e)
      }
    })
    it('should set relations correctly', async () => {
      const token = await controller.usernameToToken.call(username)
      assert.notEqual(
        token,
        NULL_ADDRESS,
        'usernameToToken should be set correctly'
      )
      assert.equal(await controller.tokenToUsername.call(token), username)
      assert.equal(await controller.tokens.call(0), token)
      assert.equal(await controller.tokensLength.call(), 1)
    })
    it('should emit correctly', async () => {
      const token = await controller.usernameToToken.call(username)
      assert(createTx.logs, 'Should produce logs')
      const event = createTx.logs.find(l => l.event === 'Create')
      assert(event, 'Should emit a withdraw event')
      assert(
        event.args.messageId === hash,
        'hash should be set correctly in the Create event'
      )
      assert(
        event.args.username === username,
        'username should be set correctly in the Create event'
      )
      assert(
        event.args.token === token,
        'token should be set correctly in the Create event'
      )
      assert(
        event.args.creator === user,
        'creator should be set correctly in the Create event'
      )
    })
    it('should set properties of child username token contract correctly', async () => {
      const address = await controller.usernameToToken.call(username)
      const usernameToken = await UsernameToken.at(address)
      assert.equal(await usernameToken.symbol.call(), username)
      assert.equal(await usernameToken.name.call(), username)
      assert.equal(await usernameToken.owner.call(), controller.address)
    })
    it('should not allow resubmitting processed hash', async () => {
      let error
      const {v, r, s} = signature
      try {
        createTx = await controller.create(username, hash, v, r, s, {
          from: user
        })
      } catch (e) {
        error = e
      }
      assert(error, 'Should error')
      assert(
        new RegExp(errTypes.ValidatorMessageProcessed).test(error.message),
        `Should error with ${errTypes.ValidatorMessageProcessed}; Got ${
          error.message
        }`
      )
    })
  })
})
