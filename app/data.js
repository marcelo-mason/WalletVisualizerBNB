const Contract = require('./contract')
const BigNumber = require('bignumber.js')

class Data {
  constructor(decimals, tokenAddress) {
    this.decimals = decimals
    this.contract = new Contract(tokenAddress, this.decimals)
  }

  /**
   * Returns all eth transactions
   */
  async txs(address) {
    try {
      let rawTxs = await this.contract.txs(address)

      const txs = rawTxs.map(tx => {
        const vals = tx.returnValues
        const amount = new BigNumber(vals._value)
          .dividedBy(10 ** this.decimals)
          .toFixed(0)
        return {
          id: vals._to,
          tx: tx.transactionHash,
          address: vals._to,
          to: vals._to,
          from: vals._from,
          amount,
          block: tx.blockNumber
        }
      })
      return txs
    } catch (err) {
      console.log('txs', err)
    }
  }

  /**
   * Returns all eth transactions
   */
  async balance(address) {
    try {
      let balance = await this.contract.balance(address)
      balance = new BigNumber(balance).dividedBy(10 ** this.decimals).toFixed(0)
      return balance
    } catch (err) {
      console.log('balance', err)
    }
  }
}

module.exports = Data
