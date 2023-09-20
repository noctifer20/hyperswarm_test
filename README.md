## How to run
Make sure to have `hyperdht` running
```shell
hyperdht --bootstrap --host 127.0.0.1 --port 30001
```
and add the following environment variables
```dotenv
TOPIC={{topic name}}
BOOTSTRAP_HOST={{hyperdht host}}
BOOTSTRAP_PORT={{hyperdht port}}
```
To run the node execute
```shell
yarn start
```
it will start the nodejs in `repl` mode, and wait for commands

### Available commands
- `createAuction(name: string, price: number)` - creates new auction
  - Every peer of the network can create an auction. Upon creation unique id is generated and the auction is broadcasted to the 
- `bid(id: string, bid: number)` - places bid on auction
  - Only non-owner can bid on auction, and the bid must be higher than the last bid.
- `closeAuction(id: string)` - closes auction
  - Only owner can close the auction. When owner closes auction it is broadcasted to the network and the auction is removed from the state.
- `state` - prints current state of the node

Helpful commands
```javascript
state.ongoingAuctions.get('auctionId') // get auction by id for non-owner
state.myAuctions.get('auctionId') // get auction by id for owner
```


### Not implemented
- transaction storage
  - problem: currently we store only state of the ongoing auctions and there is no cryptographic proof that the state is valid
  - implementation: store transactions in append only database (blockchain :D)
- consensus mechanism
  - problem: currently if transaction's payload passes the validation in directly mutates the state
  - solution: implement consensus mechanism to validate the transaction and then mutate the state
- auction discovery
  - problem: currently newly joined nodes do not receive information about auctions declared before they joined
  - solution 1: implement auction discovery mechanism when newly joined node will request state
  - solution 2: implement append only transaction database (blockchain :D) and load the history of transactions when node joins
