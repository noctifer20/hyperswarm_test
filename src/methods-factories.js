const crypto = require('crypto')
const { broadcastMessage, messagePayloadSignature } = require('./utils')

/**
 * Starts an auction
 *
 * @param swarm {Hyperswarm}
 * @param state {GlobalState}
 * @returns {(function(string, number): void)|*}
 */
exports.startAuctionFactory = (swarm, state) => (name, price) => {
  const message = {
    action: 'auctionState',
    payload: {
      id: crypto.randomBytes(32).toString('hex'),
      name,
      price,
      bids: [],
      ...messagePayloadSignature(swarm)
    }
  }

  broadcastMessage(swarm, message)

  state.myAuctions.set(message.payload.id, message.payload)
}

/**
 * Closes an auction
 *
 * @param swarm {Hyperswarm}
 * @param state {GlobalState}
 * @returns {(function(string): void)|*}
 */
exports.closeAuctionFactory = (swarm, state) => (id) => {
  if (!state.myAuctions.has(id)) {
    console.log('invalid auction id')
    return
  }

  const message = {
    action: 'auctionClosed',
    payload: {
      id,
      ...messagePayloadSignature(swarm)
    }
  }

  broadcastMessage(swarm, message)

  state.myAuctions.delete(message.payload.id)
}

/**
 * Places a bid on an auction
 *
 * @param swarm {Hyperswarm}
 * @param state {GlobalState}
 * @returns {(function(string, number): void)|*}
 */
exports.bidFactory = (swarm, state) => (id, bid) => {
  const auction = state.ongoingAuctions.get(id)
  if (!auction) {
    console.log('invalid auction id')
    return
  }
  if (
    !bid ||
    bid <= auction.price ||
    (auction.bids.length > 0 &&
      bid <= auction.bids[auction.bids.length - 1]?.bid)
  ) {
    console.log('invalid bid')
    return
  }

  const message = {
    action: 'bid',
    payload: {
      id,
      bid,
      ...messagePayloadSignature(swarm)
    }
  }

  broadcastMessage(swarm, message)

  state.ongoingAuctions.set(id, {
    ...auction,
    bids: [
      ...auction.bids,
      {
        bid: message.payload.bid,
        owner: message.payload.owner
      }
    ]
  })
}
