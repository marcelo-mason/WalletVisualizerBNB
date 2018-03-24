const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  address: String,
  block: Number,
  balance: Number,
  txs: Object
})

// indexes

schema.index({ address: 1 })

// statics

schema.statics.create = async function(address, balance, cb) {
  const obj = new this({ address, balance, txs: null })
  await obj.save(cb)
  return obj
}

schema.statics.addTxs = async function(address, txs, cb) {
  const exists = await this.findOne({ address }, cb)
  if (exists) {
    const block = txs.reduce((acc, curr) => {
      if (curr.block > acc) {
        return curr.block
      }
      return acc
    }, 0)
    exists.txs = txs
    exists.block = block
    exists.save(cb)
  }
}

schema.statics.all = async function(cb) {
  return this.find({}, cb).sort({ block: 1 })
}

schema.statics.get = async function(address, cb) {
  const tx = await this.findOne({ address }, cb)
  if (tx) {
    return tx
  }
}
module.exports = mongoose.model('Address', schema)
