const Controller = artifacts.require('Controller')
const {getCreateMessageId, getSignature} = require('../utils/signing')

module.exports = async function (deployer, network, accounts) {
  if (!/ganache|dev|test|artax/.test(network)) {
    return console.log('Skipping $2100hq token creation on', network)
  }
  const username = '2100hq'
  const messageId = getCreateMessageId(username)
  const {v, r, s} = await getSignature(messageId, accounts[0])

  const controller = await Controller.deployed()

  await controller.create(username, messageId, v, r, s)
  const token = await controller.usernameToToken.call(username)
  console.log()
  console.log(`$${username} ADDRESS`, token)
}
