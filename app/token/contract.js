const web3 = require('../web3')
const token = require('./token.abi.json')

class TokenContract {
  constructor(address, decimals) {
    this.address = address
    this.decimals = decimals
    this.contract = new web3.eth.Contract(token, address)
  }

  async txs(address, fromBlock) {
    return new Promise(async (resolve, reject) => {
      console.log('* Pulling txs', address)

      this.contract.getPastEvents(
        'Transfer',
        {
          fromBlock: fromBlock || 0,
          toBlock: 'latest',
          filter: { _from: address }
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        }
      )
    })
  }
}

module.exports = TokenContract
