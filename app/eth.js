const Contract = require('./token/contract')
const BigNumber = require('bignumber.js')
const db = require('./db')

class Eth {
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
    const cached = await db.txs.get(address)
    if (cached) {
      return cached
    }

    const txs = await this.contract.txs(address)
    const cleaned = txs.map(tx => {
      const vals = tx.returnValues
      const isOut = vals._from.toLowerCase() === address.toLowerCase()
      const amount = new BigNumber(vals._value)
        .dividedBy(10 ** this.decimals)
        .toFixed(0)
      return {
        tx: tx.transactionHash,
        direction: isOut ? 'OUT' : 'IN',
        address: isOut ? vals._to : vals._from,
        to: vals._to,
        from: vals._from,
        amount,
        size: Math.sqrt(amount),
        block: tx.blockNumber
      }
    })
    db.txs.create(address, cleaned)
    return cleaned
  }
}

module.exports = new Eth()
