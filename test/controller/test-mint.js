const Controller = artifacts.require('Controller')
const UsernameToken = artifacts.require('UsernameToken')
const {
  getCreateMessageId,
  getMintMessageId,
  getSignature
} = require('../utils/signing')
const errTypes = require('../utils/err-types')

const BN = web3.utils.BN

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

contract('Controller', accounts => {
  describe('Mint', () => {
    const username = '2100hq'
    let usernameToken
    let token
    let MintTx
    let messageId
    let signature
    let controller
    let owner = accounts[0]
    let user = accounts[1]
    const salt = new BN(1234)
    const amount = new BN(2100)

    before(async () => {
      controller = await Controller.deployed()
      const createHash = getCreateMessageId(username)
      const {v, r, s} = await getSignature(createHash, owner)
      const tx = await controller.create(username, createHash, v, r, s, {
        from: user
      })
      token = await controller.usernameToToken.call(username)
      messageId = getMintMessageId(token, user, amount, salt)
      signature = await getSignature(messageId, owner)
      usernameToken = await UsernameToken.at(token)
    })

    it('getCreateMessageId should match web3.js signing', async () => {
      assert.equal(
        messageId,
        await controller.getMintMessageId(token, user, amount, salt)
      )
    })

    it('should not allow invalid signatures', async () => {
      let error
      const {v, r, s} = await getSignature(messageId, user)
      try {
        await controller.mint(token, amount, salt, messageId, v, r, s, {
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
        await controller.mint(token, new BN(99), salt, messageId, v, r, s, {
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

    it('mints when signature message is valid, has not been seen', async () => {
      assert(
        (await usernameToken.totalSupply.call()).isZero(),
        'Total Supply should be 0'
      )
      assert(
        (await usernameToken.balanceOf.call(user)).isZero(),
        'User balance should be 0'
      )
      const {v, r, s} = signature
      try {
        MintTx = await controller.mint(
          token,
          amount,
          salt,
          messageId,
          v,
          r,
          s,
          {
            from: user
          }
        )
      } catch (e) {
        assert.notOk(e, e)
      }
    })

    it('should set balances correctly', async () => {
      assert(
        amount.eq(await usernameToken.totalSupply.call()),
        'Total Supply should increase'
      )
      assert(
        amount.eq(await usernameToken.balanceOf.call(user), amount),
        'User balance should increase'
      )
    })

    it('should emit correctly', async () => {
      assert(MintTx.logs, 'Should produce logs')
      const event = MintTx.logs.find(l => l.event === 'Mint')
      assert(event, 'Should emit a withdraw event')
      assert(
        event.args.messageId === messageId,
        'messageId should be set correctly in the Mint event'
      )
      assert(
        event.args.account === user,
        'username should be set correctly in the Mint event'
      )
      assert(
        event.args.token === token,
        'token should be set correctly in the Mint event'
      )
      assert(
        amount.eq(event.args.amount),
        'creator should be set correctly in the Mint event'
      )
    })

    it('should not allow resubmitting processed messageId', async () => {
      let error
      const {v, r, s} = signature
      try {
        MintTx = await controller.mint(
          token,
          amount,
          salt,
          messageId,
          v,
          r,
          s,
          {
            from: user
          }
        )
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
