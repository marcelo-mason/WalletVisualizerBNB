const eth = require('./eth')
const _ = require('lodash')
const async = require('awaitable-async')
const api = module.exports

api.txs = async (req, res) => {
  const address = req.params.address
  const parents = await getChildrenTxs(address, 'root')
  let children = []

  await async.eachSeries(parents, async tx => {
    const exists = _.find(children, { tx: tx.tx })
    if (!exists) {
      tx.layer = 1
      children.push(tx)
    }
    const txs = await getChildrenTxs(tx.address, tx.tx, tx.block)
    txs.forEach(x => {
      const exists = _.find(children, { tx: x.tx })
      if (!exists) {
        x.layer = 2
        children.push(x)
      }
    })
    await async.eachSeries(txs, async tx2 => {
      const txs2 = await getChildrenTxs(tx2.address, tx2.tx, tx2.block)
      txs2.forEach(x => {
        const exists = _.find(children, { tx: x.tx })
        if (!exists) {
          x.layer = 3
          children.push(x)
        }
      })
    })
  })

  children.unshift({
    tx: 'root',
    parent: null
  })
  res.send(children)
}

async function getChildrenTxs(address, parent, fromBlock) {
  let txs = await eth.txs(address, fromBlock)
  txs = txs.filter(tx => tx.direction === 'OUT')
  if (fromBlock) {
    txs = txs.filter(x => x.block >= fromBlock)
  }

  txs.forEach(tx => {
    tx.parent = parent
  })
  return txs
}
