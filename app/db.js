const mongoose = require('mongoose')
const layer = require('./models/layer')
const user = require('./models/user')
const address = require('./models/address')

class Db {
  constructor() {
    mongoose.Promise = global.Promise
    mongoose.connect(process.env.DB, {
      useMongoClient: true,
      reconnectTries: 10,
      autoIndex: false
    })
  }

  get users() {
    return user
  }

  get addresses() {
    return address
  }

  get layers() {
    return layer
  }
}

module.exports = new Db()
