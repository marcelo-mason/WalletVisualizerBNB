const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  parent: String,
  layer: Number,
  block: Number,
  balance: Number,
  txs: Object
})

// indexes

schema.index({ address: 1 })

// statics

schema.statics.create = async function(parent, balance, txs, layer, cb) {
  const block = txs.reduce((acc, curr) => {
    if (curr.block > acc) {
      return curr.block
    }
    return acc
  }, 0)
  const obj = new this({ parent, balance, txs, block, layer })
  await obj.save(cb)
  return obj
}

schema.statics.all = async function(cb) {
  return this.find({}, cb).sort({ block: 1 })
}

schema.statics.get = async function(parent, cb) {
  const tx = await this.findOne({ parent }, cb)
  if (tx) {
    return tx
  }
}
module.exports = mongoose.model('Tx', schema)
