const assert = require('assert')
const ethers = require('ethers')

// optional ethereumjs-util dependency
function offChainSignatureCheck_ethereumjs (v, r, s, hash, address) {
  const ethUtil = require('ethereumjs-util')
  const prefixedMsg = ethUtil.hashPersonalMessage(ethUtil.toBuffer(hash))
  const pubKey = ethUtil.ecrecover(prefixedMsg, v, r, s)
  const addrBuf = ethUtil.pubToAddress(pubKey)
  const recovered = ethUtil.bufferToHex(addrBuf)
  assert(
    recovered.toLowerCase() == address.toLowerCase(),
    `Recovered address should match signer ${recovered} != ${address}`
  )
}

// can't get this to work, but _ethereumjs version does
function offChainSignatureCheck_ethers (v, r, s, hash, address) {
  const flat = ethers.utils.joinSignature({v, r, s, recoveryParam: 0})
  const recovered = ethers.utils.verifyMessage(hash, flat)
  assert(
    recovered.toLowerCase() == address.toLowerCase(),
    `Off-chain recovered address should match signer ${recovered} != ${address}`
  )
}

async function onChainSignatureCheck (v, r, s, hash, address, controller) {
  try {
    assert(await controller.isValidSignature(address, hash, v, r, s))
  } catch (e) {
    const recovered = await controller.recoverEthSignedMessage(hash, v, r, s)
    assert(
      false,
      `On-chain recovered address should match signer ${recovered.toLowerCase()} != ${address.toLowerCase()}`
    )
  }
}

getCreateMessageId = function (username) {
  return ethers.utils.solidityKeccak256(
    ['string', 'string'],
    ['CREATE', username]
  )
}

getMintMessageId = function (token, account, amount, salt) {
  return ethers.utils.solidityKeccak256(
    ['string', 'address', 'uint256', 'uint256'],
    ['MINT', token, account, amount, salt]
  )
}

getSignature = async function (hash, wallet) {
  const messageHashBytes = ethers.utils.arrayify(hash)
  const flat = await wallet.signMessage(messageHashBytes)
  return ethers.utils.splitSignature(flat)
}

module.exports = (config, libs = {}) => {
  const provider =
    libs.provider ||
    new ethers.providers.JsonRpcProvider(config.ethers.provider.url)

  const contractArtifcatsPath = config.contractArtifcatsPath || '2100-contracts'

  const artifacts = {
    controller: require(`${contractArtifcatsPath}/build/contracts/Controller`),
    dai: require(`${contractArtifcatsPath}/build/contracts/DummyDAI`)
  }

  const contracts = {}

  const wallet =
    libs.wallet || new ethers.Wallet(config.test.privateKey, provider)

  Object.entries(artifacts).forEach(([name, artifact]) => {
    contracts[name] =
      libs[name] ||
      new ethers.Contract(
        artifact.networks[config.ethers.chainId].address,
        artifact.abi,
        wallet
      )
  })

  async function isOwner () {
    return (
      (await contracts.controller.owner()).toLowerCase() !=
      wallet.address.toLowerCase()
    )
  }

  async function assertOwner () {
    if (await isOwner()) {
      throw new Error('Wallet is not Controller Owner')
    }
  }

  return {
    getCreateMessageId,
    getMintMessageId,
    getSignature: hash => getSignature(hash, wallet),
    address: wallet.address,
    isOwner,
    assertOwner,
    ...contracts
  }
}

module.exports.offChainSignatureCheck_ethereumjs = offChainSignatureCheck_ethereumjs
module.exports.offChainSignatureCheck_ethers
module.exports.onChainSignatureCheck = onChainSignatureCheck
