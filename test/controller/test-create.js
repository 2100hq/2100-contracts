const Controller = artifacts.require('Controller')
const UsernameToken = artifacts.require('UsernameToken')
const {getCreateMessageId, getSignature} = require('../../utils/signing')
const errTypes = require('../utils/err-types')

const BN = web3.utils.BN

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

contract('Controller', accounts => {
  let controller
  let dai
  let owner = accounts[0]
  let user = accounts[1]

  before(async () => {
    controller = await Controller.deployed()
  })

  describe('Create', () => {
    const username = '2100hq'
    let createTx
    let messageId
    let signature
    before(async () => {
      messageId = getCreateMessageId(username)
      signature = await getSignature(messageId, owner)
    })

    it('getCreateMessageId should match web3.js signing', async () => {
      assert.equal(messageId, await controller.getCreateMessageId(username))
    })

    it('should not allow invalid signatures', async () => {
      let error
      const {v, r, s} = await getSignature(messageId, user)
      try {
        createTx = await controller.create(username, messageId, v, r, s, {
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
        createTx = await controller.create('somename', messageId, v, r, s, {
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
        createTx = await controller.create(username, messageId, v, r, s, {
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
        event.args.messageId === messageId,
        'messageId should be set correctly in the Create event'
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

    it('should not allow resubmitting processed messageId', async () => {
      let error
      const {v, r, s} = signature
      try {
        createTx = await controller.create(username, messageId, v, r, s, {
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
