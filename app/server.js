require('dotenv').config()

const join = require('path').join
const bodyParser = require('body-parser')
const express = require('express')
const app = express()

// parse body middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// home
app.use(express.static(join(__dirname, '../wwwroot')))

// api
const api = require('./api')
app.route('/api/txs/:address/:layers?').get(api.txs)
app.route('/address/:address/:layers?').get((req, res) => {
  res.sendFile(join(__dirname, '../wwwroot/index.html'))
})
app.route('/').get((req, res) => {
  res.send('hello')
})

// start api
const port = process.env.PORT || 3000
app.listen(port)
console.log(`Started on port ${port}`)

// errors
process.on('unhandledRejection', (reason, p) => {
  console.log(p)
})
