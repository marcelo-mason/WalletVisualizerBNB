const mongoose = require('mongoose')
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

  get addresses() {
    return address
  }
}

module.exports = new Db()
