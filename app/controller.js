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
    console.log('\n* Layer', num, 'emitted')
  }

  async pullNextLayer(layers) {
    const currentLayer = layers[layers.length - 1]
    const nextLayer = (layers[layers.length] = [])
    const layerNum = layers.length - 2

    console.log('* Pulling next layer', layers.length - 1)

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

      txs.forEach(child => {
        const sameTx = _.find(nextLayer, { id: child.id })
        const sameFromTo = _.find(nextLayer, {
          from: child.from,
          to: child.to
        })

        if (!sameTx && !sameFromTo) {
          nextLayer.push(child)
        }
      })

      process.stdout.write(
        `\n${layerNum} ${node.id.slice(0, 12)} ${node.from.slice(
          0,
          5
        )}-${node.to.slice(0, 5)} `
      )
    })
    process.stdout.write(`= ${nextLayer.length}`)
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
    process.stdout.write(`${txs.length}tx `)
    return txs
  }
}

module.exports = Controller
