const web3 = require('./web3')
const token = require('../token.abi.json')

class TokenContract {
  constructor(address, decimals) {
    this.address = address
    this.decimals = decimals
    this.contract = new web3.eth.Contract(token, address)
  }

  async txs(address, fromBlock) {
    console.log('* Pulling txs', address)

    return this.contract.getPastEvents('Transfer', {
      fromBlock: fromBlock || 0,
      toBlock: 'latest',
      filter: { _from: address }
    })
  }

  async balance(address) {
    return this.contract.methods.balanceOf(address).call()
  }
}

module.exports = TokenContract
