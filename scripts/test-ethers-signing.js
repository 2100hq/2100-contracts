const Signer = require('../utils/ethers-signer')

const config = {
  contractArtifcatsPath: '..',
  ethers: {
    provider: {
      url: process.env.URL
    }
  },
  test: {
    privateKey: process.env.PRIVATE_KEY
  }
}

const signer = Signer(config)

async function run () {
  const username = '2100hq'

  console.log('WALLET ADDRESS', signer.address)

  await signer.assertOwner()
  const hash = signer.getCreateMessageId(username)
  const onChainhash = await signer.controller.getCreateMessageId(username)

  console.log(hash === onChainhash && 'HASHES MATCH!')

  const {v, r, s} = await signer.getSignature(hash)

  Signer.offChainSignatureCheck_ethereumjs(v, r, s, hash, signer.address)

  await Signer.onChainSignatureCheck(
    v,
    r,
    s,
    hash,
    signer.address,
    signer.controller
  )

  console.log('SIGNATURES MATCH!')
}

run()
