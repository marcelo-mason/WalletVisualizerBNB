const data = require('./data')
const _ = require('lodash')
const async = require('awaitable-async')
const api = module.exports

api.txs = async (req, res) => {
  const address = req.params.address
  const { balance, txs } = await getData(address)
  let nodes = []
  const MAX_LAYERS = 3

  async function recurse(parentTx) {
    let d = await getData(parentTx.address, parentTx)
    parentTx.balance = d.balance
    await async.eachSeries(d.txs, async tx => {
      const exists = _.find(nodes, { tx: tx.tx })
      if (!exists) {
        tx.balance = tx.balance || tx.amount
        tx.layer = parentTx.layer + 1
        nodes.push(tx)
        if (tx.layer < MAX_LAYERS) {
          await recurse(tx)
        }
      }
    })
  }

  await async.eachSeries(txs, async topLevelTx => {
    topLevelTx.layer = 1
    nodes.push(topLevelTx)
    await recurse(topLevelTx)
  })

  console.log('* Data collected')

  nodes.unshift({
    tx: 'root',
    balance,
    parent: null
  })

  res.send(nodes)
}

async function getData(address, parent, layer) {
  const parentTx = parent ? parent.tx : 'root'
  const parentBlock = parent ? parent.block : null

  let d = await data.balanceAndTxs(address, layer)

  let txs = d.txs
  if (parent) {
    txs = txs.filter(x => x.block >= parentBlock)
  }
  txs.forEach(tx => {
    tx.parent = parentTx
  })
  return { balance: d.balance, txs }
}
