const data = require('./data')
const _ = require('lodash')
const async = require('awaitable-async')
const api = module.exports

api.txs = async (req, res) => {
  const address = req.params.address
  const { balance, txs } = await getData(address)
  let children = []

  await async.eachSeries(txs, async tx => {
    const exists = _.find(children, { tx: tx.tx })
    if (!exists) {
      tx.layer = 1
      children.push(tx)
    }

    let d = await getData(tx.address, tx)
    tx.balance = d.balance
    d.txs.forEach(x => {
      const exists = _.find(children, { tx: x.tx })
      if (!exists) {
        x.balance = x.amount
        x.layer = 2
        children.push(x)
      }
    })

    await async.eachSeries(d.txs, async tx => {
      let d = await getData(tx.address, tx)
      tx.balance = d.balance
      d.txs.forEach(x => {
        const exists = _.find(children, { tx: x.tx })
        if (!exists) {
          x.balance = x.amount
          x.layer = 3
          children.push(x)
        }
      })
    })
  })

  console.log('* Data collected')

  children.unshift({
    tx: 'root',
    balance,
    parent: null
  })

  res.send(children)
}

async function getData(address, parent) {
  const parentTx = parent ? parent.tx : 'root'
  const parentBlock = parent ? parent.block : null

  let d = await data.balanceAndTxs(address, parentBlock)
  let txs = d.txs
  if (parent) {
    txs = txs.filter(x => x.block >= parentBlock)
  }
  txs.forEach(tx => {
    tx.parent = parentTx
  })
  return { balance: d.balance, txs }
}
