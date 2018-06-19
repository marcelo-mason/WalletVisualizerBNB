const mongoose = require('mongoose')
const Schema = mongoose.Schema

const addressSchema = new Schema({
  userId: String,
  chain: String,
  address: String,
  url: String,
  active: Boolean,
  receiving: Boolean,
  created: Date
})

// indexes

const collation = { locale: 'en', strength: 2 }

addressSchema.index({ userId: 1, chain: 1 }, { collation })

// statics

addressSchema.statics.all = async function(cb) {
  return this.find({}, cb)
}

addressSchema.statics.findAddress = async function(userId, address, cb) {
  return this.findOne({ userId, address }, cb).collation(collation)
}

addressSchema.statics.get = async function(address, cb) {
  return this.findOne({ address }, cb).collation(collation)
}

addressSchema.statics.getActive = async function(data, cb) {
  return this.findOne(
    {
      ...data,
      active: true
    },
    cb
  ).collation(collation)
}

addressSchema.statics.getReceiving = async function(data, cb) {
  return this.findOne(
    {
      ...data,
      receiving: true
    },
    cb
  ).collation(collation)
}

module.exports = mongoose.model('Address', addressSchema)
