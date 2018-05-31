const express = require('express')
const path = require('path');
const app = express()
const chatRouter = require('./routes/chat')
const loginRouter = require('./routes/login')
const dashboardRouter = require('./routes/dashboard')
const meusDadosRouter = require('./routes/meusdados')
const bodyParser = require('body-parser')
var session = require('client-sessions');
var cfenv = require("cfenv");


const serverPort = process.env.PORT || 3000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/chat',chatRouter)
app.use('/login',loginRouter)
app.use('/dashboard',dashboardRouter)
app.use('/meusdados',meusDadosRouter)

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.sendFile('./views/login.html',{root: __dirname});
})

app.get('/login', function (req, res) {
  res.sendFile('./views/login.html',{root: __dirname});
})

app.get('/dashboard', function (req, res) {
  res.sendFile('./views/dashboard.html',{root: __dirname});
})

app.get('/meusdados', function (req, res) {
  res.sendFile('./views/meusdados.html',{root: __dirname});
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
// Check if user and email exist on database
 app.post("/api/login", function (request, response) {
  var email = request.body.email;
  var password = request.body.password;

  if(!myUsers) {
    console.log("No database.");
    response.send("No database.");
    return;
  }
  var status = false;
  myUsers.list({ include_docs: true }, function(err, body) {
    if (!err) {
      body.rows.forEach(function(row) {
        if(row.doc.email == email)
          if (row.doc.password == password){
            status = true;
          }
      });
      if (status == true){
        request.sessionprofessorvirtual = { 'email': email, 'password': password};
        response.send(true);
      }else {
        request.sessionprofessorvirtual = { 'email': null, 'password': null};
        response.send(false);
      }
      }
    });
  });

  //Check if email and password of session exist on database
  app.get('/api/validSession', function (request, response) {
    var status = false;
    if (request.sessionprofessorvirtual) { // Check if session exists
      myUsers.list({ include_docs: true }, function(err, body) {
        if (!err) {
          body.rows.forEach(function(row) {
            if(row.doc.email == request.sessionprofessorvirtual.email)
              if (row.doc.password == request.sessionprofessorvirtual.password){
                status = true;
              }
        });
          if (status == true)
            response.send(true);
          else {
            response.send(false);
          }
        }
      });
    } else {
      response.send(false);
    }
  });

  //Destroy the current session
  app.get('/api/destroySession', function(request,response) {
    request.sessionprofessorvirtual.destroy(function(err) {
      response.send(false);
    })
    response.send(true);
  });

  //Get current session
  app.get('/api/getSession', function(request,response) {
      response.send(request.sessionprofessorvirtual.email);
  });

  //Get user data
  app.get('/api/getUserInformation', function(request,response) {
    var info = [];

    if (request.sessionprofessorvirtual.email) { // Check if session exists
      myUsers.list({ include_docs: true }, function(err, body) {
        if (!err) {
          body.rows.forEach(function(row) {
            //First check it the user have access
            if(row.doc.email == request.sessionprofessorvirtual.email){
              if (row.doc.password == request.sessionprofessorvirtual.password){
                //Now it can get the user data
                myUsers.list({ include_docs: true }, function(err, body) {
                   if (!err) {
                      body.rows.forEach(function(row2) {
                          if(row2.doc.email == request.sessionprofessorvirtual.email){
                            console.log(row2.doc.email);
                            console.log(row2.doc.email);
                            info.push(row2.doc);
                          }
                        });
                        response.json(info);
                    }
                });
              }else{
                response.send("LOG: User invalid!");
              }
            }
          });
        }
      });
    } else{
      response.send("LOG: Session not found!");
    }
});




app.listen(serverPort, function () {
  console.log('App listening on port %d!',serverPort)
})
