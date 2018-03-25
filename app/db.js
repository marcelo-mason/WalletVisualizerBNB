const mongoose = require('mongoose')
const layer = require('./models/layer')

class Db {
  constructor() {
    mongoose.Promise = global.Promise
    mongoose.connect(process.env.DB, {
      useMongoClient: true,
      reconnectTries: 10,
      autoIndex: false
    })
  }

  get layers() {
    return layer
  }
}

module.exports = new Db()
