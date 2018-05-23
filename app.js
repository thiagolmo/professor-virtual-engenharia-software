const express = require('express')
const path = require('path');
const app = express()
const chatRouter = require('./routes/chat')
const bodyParser = require('body-parser')


const serverPort = process.env.PORT || 3000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/chat',chatRouter)
app.use(express.static(path.join(__dirname, 'public')));


app.get('/login', function (req, res) {
  res.sendFile('./views/login.html',{root: __dirname});
})

app.get('/', function (req, res) {
  res.sendFile('./views/chat.html',{root: __dirname});
})


app.listen(serverPort, function () {
  console.log('App listening on port %d!',serverPort)
})
