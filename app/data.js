const Contract = require('./contract')
const BigNumber = require('bignumber.js')
const db = require('./db')

class Data {
  constructor() {
    this.decimals = 12
    this.contract = new Contract(
      '0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27',
      this.decimals
    )
  }

  /**
   * Returns all eth transactions
   */
  async txs(address) {
    const cached = await db.addresses.get(address)
    if (cached && cached.txs) {
      return cached.txs
    }

    let rawTxs = await this.contract.txs(address)

    const txs = rawTxs.map(tx => {
      const vals = tx.returnValues
      const amount = new BigNumber(vals._value)
        .dividedBy(10 ** this.decimals)
        .toFixed(0)
      return {
        id: tx.transactionHash,
        address: vals._to,
        to: vals._to,
        from: vals._from,
        amount,
        block: tx.blockNumber
      }
    })

    await db.addresses.addTxs(address, txs)
    return txs
  }

  /**
   * Returns all eth transactions
   */
  async balance(address) {
    const cached = await db.addresses.get(address)
    if (cached) {
      return cached.balance
    }

    let balance = await this.contract.balance(address)
    balance = new BigNumber(balance).dividedBy(10 ** this.decimals).toFixed(0)

    await db.addresses.create(address, balance)
    return balance
  }
}

module.exports = new Data()
