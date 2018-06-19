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
app
  .route('/start/:address/:layers/:tokenSymbol/:tokenAddress/:decimals')
  .get((req, res) => {
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

/*

http://localhost:3000/start/0x1fa2e3f271b7a6f9242d7f5ee9121948f6cfa7ff/3/FMF/0xb4d0fdfc8497aef97d3c2892ae682ee06064a2bc/18

*/
