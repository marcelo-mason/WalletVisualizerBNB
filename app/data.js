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
  async balanceAndTxs(address) {
    const cached = await db.txs.get(address)
    if (cached) {
      return cached
    }

    let balance
    let rawTxs
    try {
      balance = await this.contract.balance(address)
      rawTxs = await this.contract.txs(address)
    } catch (err) {
      balance = await this.contract.balance(address)
      rawTxs = await this.contract.txs(address)
    }

    balance = new BigNumber(balance).dividedBy(10 ** this.decimals).toFixed(0)

    const txs = rawTxs.map(tx => {
      const vals = tx.returnValues
      const amount = new BigNumber(vals._value)
        .dividedBy(10 ** this.decimals)
        .toFixed(0)
      return {
        tx: tx.transactionHash,
        address: vals._to,
        to: vals._to,
        from: vals._from,
        amount,
        block: tx.blockNumber
      }
    })
    await db.txs.create(address, balance, txs)
    return { balance, txs }
  }
}

module.exports = new Data()
