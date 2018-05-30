const express = require('express')
const path = require('path');
const app = express()
const chatRouter = require('./routes/chat')
const loginRouter = require('./routes/login')
const bodyParser = require('body-parser')
var session = require('client-sessions');
var cfenv = require("cfenv");


const serverPort = process.env.PORT || 3000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/chat',chatRouter)
app.use('/login',loginRouter)

app.use(express.static(path.join(__dirname, 'public')));


app.get('/login', function (req, res) {
  res.sendFile('./views/login.html',{root: __dirname});
})

app.get('/', function (req, res) {
  res.sendFile('./views/chat.html',{root: __dirname});
})

app.use(session({
  cookieName: 'sessionprofessorvirtual',
  secret: 'random_string_goes_here',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

// load local VCAP configuration  and service credentials
var vcapLocal;

try {
  vcapLocal = require('./vcap-local.json');
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}

const appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.services['cloudantNoSQLDB'] || appEnv.getService(/cloudant/)) {
  // Load the Cloudant library.
  var Cloudant = require('cloudant');

  // Initialize database with credentials
  if (appEnv.services['cloudantNoSQLDB']) {
     // CF service named 'cloudantNoSQLDB'
     var cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);
  } else {
     // user-provided service with 'cloudant' in its name
     var cloudant = Cloudant(appEnv.getService(/cloudant/).credentials);
  }

  //database name
  var dbUser = 'professor-virtual-engenharia-software-users';

  //Create the database.
  cloudant.db.create(dbUser, function(err, data) {
    if(!err) //err if database doesn't already exists
      console.log("Created database: " + dbUser);
  });

  // Specify the database we are going to use (mydb)...
  mydb = cloudant.db.use(dbUser);
  myUsers = cloudant.db.use(dbUser);
}



app.listen(serverPort, function () {
  console.log('App listening on port %d!',serverPort)
})
