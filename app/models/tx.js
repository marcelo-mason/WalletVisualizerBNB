const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  parent: String,
  block: Number,
  balance: Number,
  txs: Object
})

// indexes

schema.index({ address: 1 })

// statics

schema.statics.create = async function(parent, balance, txs, cb) {
  const block = txs.reduce((acc, curr) => {
    if (curr.block > acc) {
      return curr.block
    }
    return acc
  }, 0)
  const obj = new this({ parent, balance, txs, block })
  await obj.save(cb)
  return obj
}

schema.statics.get = async function(parent, cb) {
  const tx = await this.findOne({ parent }, cb)
  if (tx) {
    return tx
  }
}
module.exports = mongoose.model('Tx', schema)
