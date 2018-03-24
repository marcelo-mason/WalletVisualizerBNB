const data = require('./data')
const async = require('awaitable-async')
const _ = require('lodash')

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
      await this.pullNextLayer(layers)
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

  async pullNextLayer(layers) {
    const allPast = _.flatten(layers)
    const currentLayer = layers[layers.length - 1]
    const nextLayer = (layers[layers.length] = [])
    const layerNum = layers.length - 2

    process.stdout.write(`\n# Pulling layer ${layerNum}`)

    await async.eachSeries(currentLayer, async node => {
      const [txs, balance] = await async.parallel([
        callback => {
          this.getTxs(node.address, node).then(result => {
            callback(null, result)
          })
        },
        callback => {
          data.balance(node.address, node).then(result => {
            callback(null, result)
          })
        }
      ])

      node.layer = layerNum
      node.balance = balance

      process.stdout.write(
        `\n${layerNum} ${node.id.slice(0, 12)} ${node.from.slice(
          0,
          5
        )}-${node.to.slice(0, 5)} ${txs.length}tx ${balance}`
      )

      txs.forEach(child => {
        const sameSelf = child.from === child.to
        const sameFromTo = _.find(nextLayer, {
          from: child.from,
          to: child.to
        })
        const backwards = _.find(allPast, { to: child.to })
        if (sameSelf) {
          process.stdout.write(' sameSelf')
        }
        if (sameFromTo) {
          process.stdout.write(' sameFromTo')
        }
        if (backwards) {
          process.stdout.write(' backwards')
        }

        if (!sameFromTo && !backwards && !sameSelf) {
          nextLayer.push(child)
        }
      })
    })
    process.stdout.write(`\n* Next layer length ${nextLayer.length}`)
  }

  async getTxs(address, node) {
    const isRoot = node.id === 'root'
    const parentTx = isRoot ? 'root' : node.id
    const parentBlock = isRoot ? null : node.block

    let txs = await data.txs(address)

    if (!isRoot) {
      txs = txs.filter(x => x.block >= parentBlock)
    }
    txs.forEach(tx => {
      tx.parent = parentTx
    })
    return txs
  }
}

module.exports = Controller
