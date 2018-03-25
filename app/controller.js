const data = require('./data')
const async = require('awaitable-async')
const _ = require('lodash')
const db = require('./db')

class Controller {
  constructor(socket) {
    this.socket = socket
  }

  async init() {
    // init listeners
    this.socket.on('start', (o, m) => {
      this.start(o.address, o.maxLayers)
    })
  }

  async start(address, maxLayers = 2) {
    let layers = []

    console.log(`* Starting ${address} ${maxLayers}`)
    // init root and first layer
    let balance = await data.balance(address)
    layers.push([
      {
        id: 'root',
        from: 'root',
        to: address,
        address,
        balance,
        parent: null,
        layer: 0
      }
    ])

    while (layers.length - 2 < maxLayers) {
      await this.pullNextLayer(layers, address)
      await this.emitLayer(layers, layers.length - 2)
    }
  }

  async emitLayer(layers, num) {
    await this.socket.emit('layer', {
      layer: num,
      txs: layers[num]
    })
    process.stdout.write(`\n* Layer ${num} emitted`)
  }

  async pullNextLayer(layers, rootAddress) {
    const allPast = _.flatten(layers)
    const currentLayer = layers[layers.length - 1]
    const nextLayer = (layers[layers.length] = [])
    const currentLayerNum = layers.length - 2
    const nextLayerNum = layers.length - 1

    process.stdout.write(`\n# Pulling layer ${currentLayerNum}`)

    const nextCached = await db.layers.get(rootAddress, nextLayerNum)

    if (nextCached) {
      nextCached.data.forEach(x => nextLayer.push(x))
    }

    if (nextCached && nextCached.complete) {
      process.stdout.write(
        `\n* Next layer length ${nextLayer.length} (cached complete)`
      )
      return
    }

    await async.eachLimit(currentLayer, 8, async node => {
      let balance
      let txs

      if (!('balance' in node)) {
        balance = await data.balance(node.address, node)
        if (balance) {
          node.layer = currentLayerNum
          node.balance = balance
        }
      } else {
        balance = 'cached'
      }

      if (!nextCached) {
        txs = await this.getTxs(node.address, node)
        if (txs) {
          txs.forEach(child => {
            const sameSelf = child.from === child.to
            const sameFromTo = _.find(nextLayer, {
              from: child.from,
              to: child.to
            })
            const backwards = _.find(allPast, { to: child.to })

            if (sameFromTo) {
              sameFromTo.same = sameFromTo.same++ || 0
            }

            if (!sameFromTo && !backwards && !sameSelf) {
              nextLayer.push(child)
            }
          })
        }
      }

      process.stdout.write(
        `\n${currentLayerNum} ${node.id.slice(0, 12)} ${node.from.slice(
          0,
          5
        )}-${node.to.slice(0, 5)} ${balance} ${txs ? txs.length : 'c'}tx`
      )
    })

    await db.layers.createOrUpdate(rootAddress, nextLayerNum, nextLayer)
    if (currentLayerNum > 0) {
      await db.layers.createOrUpdate(rootAddress, currentLayerNum, currentLayer)
    }

    process.stdout.write(`\n* Next layer length ${nextLayer.length}`)
  }

  async getTxs(address, node) {
    const isRoot = node.id === 'root'
    const parentTx = isRoot ? 'root' : node.id
    const parentBlock = isRoot ? null : node.block

    let txs = await data.txs(address)
    if (txs) {
      if (!isRoot) {
        txs = txs.filter(x => x.block >= parentBlock)
      }
      txs.forEach(tx => {
        tx.parent = parentTx
      })
      return txs
    }
  }
}

module.exports = Controller
