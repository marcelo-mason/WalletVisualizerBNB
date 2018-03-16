const mongoose = require('mongoose')
const tx = require('./models/tx')

class Db {
  constructor() {
    mongoose.Promise = global.Promise
    mongoose.connect(process.env.DB, {
      useMongoClient: true,
      reconnectTries: 10,
      autoIndex: false
    })
  }

  get txs() {
    return tx
  }
}

module.exports = new Db()
