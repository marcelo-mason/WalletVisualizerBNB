const Data = require('./data')
const async = require('awaitable-async')
const _ = require('lodash')
const db = require('./db')

class Controller {
  constructor(socket) {
    this.socket = socket
    this.data = null
  }

  async init() {
    // init listeners
    this.socket.on('start', (o, m) => {
      this.start(
        o.address,
        parseInt(o.maxLayers),
        o.tokenSymbol,
        o.tokenAddress,
        parseInt(o.decimals)
      )
    })
  }

  async start(address, maxLayers, tokenSymbol, tokenAddress, decimals) {
    let layers = []

    console.log(`* Starting ${address} ${maxLayers}`)
    // init root and first layer
    this.data = new Data(decimals, tokenAddress)
    let balance = await this.data.balance(address)
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

    let countdown = currentLayer.length
    await async.eachLimit(currentLayer, 8, async node => {
      let balance
      let txs

      if (!('balance' in node)) {
        balance = await this.data.balance(node.address, node)
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
          await async.each(txs, async child => {
            const sameSelf = child.from === child.to
            const sameFromTo = _.find(nextLayer, {
              from: child.from,
              to: child.to
            })
            const backwards = _.find(allPast, { to: child.to })

            if (backwards) {
              child.backwards = true
            }

            if (sameFromTo) {
              sameFromTo.same = sameFromTo.same++ || 1
            }

            if (!sameFromTo && !sameSelf) {
              child.user = null
              const found = await db.addresses.get(child.address)
              if (found) {
                const user = await db.users.get(found.userId)
                if (user) {
                  child.user = user.displayname
                }
              }
              nextLayer.push(child)
            }
          })
        }
      }

      process.stdout.write(
        `\n${--countdown} ${currentLayerNum} ${node.id.slice(
          0,
          12
        )} ${node.from.slice(0, 5)}-${node.to.slice(0, 5)} ${balance} ${
          txs ? txs.length : 'c'
        }tx`
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

    let txs = await this.data.txs(address)
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
