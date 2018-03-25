const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  address: String,
  complete: Boolean,
  layer: Number,
  data: Object
})

// indexes

schema.index({ address: 1 })

// statics

schema.statics.createOrUpdate = async function(address, layer, data, cb) {
  const exists = await this.findOne({ address, layer }, cb)
  if (exists) {
    exists.data = data
    exists.complete = true
    await exists.save(cb)
  } else {
    const obj = new this({ address, layer, data })
    await obj.save(cb)
  }
}

schema.statics.all = async function(cb) {
  return this.find({}, cb).sort({ block: 1 })
}

schema.statics.get = async function(address, layer, cb) {
  const tx = await this.findOne({ address, layer }, cb)
  if (tx) {
    return tx
  }
}

schema.statics.has = async function(address, layer, cb) {
  return this.find({ address, layer }).count(cb) > 0
}

module.exports = mongoose.model('Address', schema)
