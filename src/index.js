const {
  bidFactory,
  closeAuctionFactory,
  startAuctionFactory
} = require('./methods-factories')
const { dataReducerFactory } = require('./data-reducer-factory')
const Hyperswarm = require('hyperswarm')
const repl = require('node:repl')
const { get } = require('env-var')
require('dotenv').config()

const TOPIC = get('TOPIC').required().asString()
const BOOTSTRAP_HOST = get('BOOTSTRAP_HOST').required().asString()
const BOOTSTRAP_PORT = get('BOOTSTRAP_PORT').required().asPortNumber()

/**
 * @typedef {{owner: String, price: Number}} Bid
 * @typedef {{id: String, name: String, price: String, bids: Bid[]}} Auction
 * @typedef {{ongoingAuctions: Map<string, Auction>, myAuctions: Map<string, Auction>}} GlobalState
 * @type GlobalState
 */
const globalState = {
  ongoingAuctions: new Map(),
  myAuctions: new Map()
}

const dataReducer = dataReducerFactory(globalState)

const main = async () => {
  const swarm = new Hyperswarm({
    bootstrap: [{ host: BOOTSTRAP_HOST, port: BOOTSTRAP_PORT }]
  })

  swarm.on('connection', (conn, info) => {
    conn.on('data', (data) => dataReducer(data, info))
  })

  const discovery = swarm.join(Buffer.alloc(32).fill(TOPIC), {
    server: true,
    client: true
  })
  await discovery.flushed()
  await swarm.flush()

  global.startAuction = startAuctionFactory(swarm, globalState)
  global.closeAuction = closeAuctionFactory(swarm, globalState)
  global.bid = bidFactory(swarm, globalState)
  global.state = globalState
  global.swarm = swarm

  repl.start({
    prompt: '> ',
    useGlobal: true
  })
}

main().catch(console.error)
