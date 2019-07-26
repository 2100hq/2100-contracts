const Controller = artifacts.require('Controller')
const DummyDAI = artifacts.require('DummyDAI')
const UsernameToken = artifacts.require('UsernameToken')
const {getCreateMessageId, getSignature} = require('../../utils/signing')
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
})
