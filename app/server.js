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
app.route('/address/:address/:layers?').get((req, res) => {
  res.sendFile(join(__dirname, '../wwwroot/index.html'))
})
app.route('/').get((req, res) => {
  res.send('hello')
})

// start api
const port = process.env.PORT || 3000
const server = app.listen(port)
console.log(`Started on port ${port}`)

// errors
process.on('unhandledRejection', (reason, p) => {
  console.log(p)
})

// start socket.io
var io = require('socket.io')(server)
const Controller = require('./controller')

io.on('connection', socket => {
  console.log('Socket connected', socket.id)
  new Controller(socket).init()
})
