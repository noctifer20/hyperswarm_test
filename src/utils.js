const sodium = require('sodium-universal')
const b4a = require('b4a')

/**
 * Signs a signable with a keypair
 *
 * @param signable
 * @param keyPair
 * @returns {Buffer}
 */
exports.sign = (signable, keyPair) => {
  if (keyPair.sign) {
    return keyPair.sign(signable)
  }
  const secretKey = keyPair.secretKey ? keyPair.secretKey : keyPair
  const signature = b4a.allocUnsafe(64)
  sodium.crypto_sign_detached(signature, signable, secretKey)
  return signature
}

/**
 * Verifies a signature
 *
 * @param signature
 * @param signable
 * @param publicKey
 * @returns {Boolean}
 */
exports.verify = (signature, signable, publicKey) => {
  return sodium.crypto_sign_verify_detached(signature, signable, publicKey)
}

/**
 * Generates a message payload signature
 *
 * @param swarm {Hyperswarm}
 * @returns {{owner: string, nonce: string, timestamp: number}}
 */
exports.messagePayloadSignature = (swarm) => {
  const timestamp = Date.now()
  return {
    timestamp,
    owner: swarm.keyPair.publicKey.toString('hex'),
    nonce: exports
      .sign(b4a.from(timestamp.toString(), 'utf-8'), swarm.keyPair)
      .toString('hex')
  }
}

/**
 * Verifies a message payload signature
 *
 * @param payload {{owner: string, nonce: string, timestamp: number}}
 * @param peerInfo {PeerInfo}
 * @returns {Boolean}
 */
exports.verifyMessagePayloadSignature = (payload, peerInfo) => {
  return (
    payload.owner === peerInfo.publicKey.toString('hex') &&
    exports.verify(
      b4a.from(payload.nonce, 'hex'),
      b4a.from(payload.timestamp.toString()),
      peerInfo.publicKey
    )
  )
}

/**
 * Broadcasts a message to all connected peers
 *
 * @param swarm {Hyperswarm}
 * @param message {Object}
 */
exports.broadcastMessage = (swarm, message) => {
  const messageRaw = Buffer.from(JSON.stringify(message), 'utf-8')

  swarm.connections.forEach((conn) => conn.write(messageRaw))
}
