const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema(
  {
    id: String,
    username: {
      type: String,
      alias: 'name'
    },
    displayname: String,
    fullname: String,
    location: {
      name: String,
      lat: String,
      lng: String
    },
    email: String,
    phone: String,
    image: String,
    tz: String,
    timezone: String,
    timezoneOffset: Number,
    active: Boolean,
    roles: [String],
    reference: String,
    occupation: String,
    industry: String,
    linkedin: String,
    twitter: String,
    reddit: String,
    netWorth: String,
    teamInterest: [String],
    bio: String,
    website: String,
    valueAdd: String,
    joined: Date,
    firstActive: Date,
    lastActive: Date,
    messageCount: Number,
    chatId: String,
    missedFunding: Number,
    tier: Number
  },
  { id: false }
)

// indexes

userSchema.index({ id: 1 })

// statics

userSchema.statics.get = async function(nameOrId, cb) {
  if (!nameOrId || !nameOrId.length) {
    return
  }
  nameOrId = nameOrId.replace('@', '')

  return this.findOne({
    $or: [{ username: nameOrId }, { id: nameOrId }]
  })
}

userSchema.statics.all = async function(cb) {
  return this.find({}, cb).sort({ username: 1 })
}

// methods

userSchema.methods.hasRole = async function(role, cb) {
  const index = this.roles.indexOf(role)
  return index > -1
}

userSchema.methods.merge = async function(data, cb) {
  Object.assign(this, data)
  await this.save(cb)
}

userSchema.methods.getActiveAddress = async function(chain, cb) {
  const address = await this.model('Address').getActive(
    {
      userId: this.id,
      chain: chain
    },
    cb
  )
  if (address) {
    return address.address
  }
}

userSchema.methods.getReceivingAddress = async function(chain, cb) {
  const address = await this.model('Address').getReceiving(
    {
      userId: this.id,
      chain: chain
    },
    cb
  )
  if (address) {
    return address.address
  }
}

module.exports = mongoose.model('User', userSchema)
