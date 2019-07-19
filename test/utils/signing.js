const assert = require('assert')
const ethUtil = require('ethereumjs-util')

function sanityCheck (v, r, s, hash, signer) {
  const prefixedMsg = ethUtil.hashPersonalMessage(ethUtil.toBuffer(hash))
  const pubKey = ethUtil.ecrecover(prefixedMsg, v, r, s)
  const addrBuf = ethUtil.pubToAddress(pubKey)
  const recovered = ethUtil.bufferToHex(addrBuf)
  assert(
    recovered.toLowerCase() == signer.toLowerCase(),
    `Recovered address should match signer ${recovered} != ${signer}`
  )
}

exports.getCreateMessageId = function (username) {
  return web3.utils.soliditySha3('CREATE', username)
}

exports.getSignature = async function (hash, signer) {
  const signature = await web3.eth.sign(hash, signer)

  const {v, r, s} = ethUtil.fromRpcSig(signature)

  sanityCheck(v, r, s, hash, signer)

  return {
    r: ethUtil.bufferToHex(r),
    s: ethUtil.bufferToHex(s),
    v
  }
}
