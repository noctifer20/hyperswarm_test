const { verifyMessagePayloadSignature } = require('./utils')

/**
 * Reduces incoming data into the global state
 *
 * @param state {GlobalState}
 * @returns {(function(Buffer, PeerInfo): void)|*}
 */
exports.dataReducerFactory = (state) => (data, peerInfo) => {
  const dataString = data.toString()
  let dataJson = {}

  try {
    dataJson = JSON.parse(dataString)
  } catch (e) {
    console.log(e)
  }

  const action = dataJson.action
  const payload = dataJson.payload

  if (!verifyMessagePayloadSignature(payload, peerInfo)) {
    console.log('invalid nonce')
    return
  }

  switch (action) {
    case 'auctionState':
      state.ongoingAuctions.set(payload.id, payload)
      break
    case 'auctionClosed': {
      const auction = state.ongoingAuctions.get(payload.id)

      if (auction.owner !== peerInfo.publicKey.toString('hex')) {
        console.log('invalid nonce')
        return
      }

      state.ongoingAuctions.delete(payload.id)
      break
    }
    case 'bid': {
      const auction =
        state.ongoingAuctions.get(payload.id) ||
        state.myAuctions.get(payload.id)

      if (!auction) {
        console.log('invalid auction')
        return
      }

      if (
        payload.owner !== peerInfo.publicKey.toString('hex') ||
        payload.owner === auction.owner
      ) {
        console.log('invalid transaction')
        return
      }

      if (
        payload.bid <= auction.price ||
        (auction.bids.length > 0 &&
          payload.bid <= auction.bids[auction.bids.length - 1]?.bid)
      ) {
        console.log('invalid bid')
        return
      }

      auction.bids = [
        ...auction.bids,
        {
          bid: payload.bid,
          owner: payload.owner
        }
      ]
      break
    }
  }
}
