const express = require('express')
const path = require('path');
const app = express()
const chatRouter = require('./routes/chat')
const loginRouter = require('./routes/login')
const dashboardRouter = require('./routes/dashboard')
const meusDadosRouter = require('./routes/meusdados')
const registroRouter = require('./routes/registro')
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
app.use('/registro',registroRouter)

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

app.get('/registro', function (req, res) {
  res.sendFile('./views/registro.html',{root: __dirname});
})

app.get('/novoaluno', function (req, res) {
  res.sendFile('./views/novoaluno.html',{root: __dirname});
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
  vcapLocal = require('./vcap.json');
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

//const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}

//const appEnv = cfenv.getAppEnv(appEnvOpts);


if (vcapLocal.cloudantNoSQLDB[0]) {
  // Load the Cloudant library.
  var Cloudant = require('cloudant');

  // Initialize database with credentials
  if (vcapLocal.cloudantNoSQLDB[0]) {
     var cloudant = Cloudant(vcapLocal.cloudantNoSQLDB[0].credentials);
  } else {
     console.log("Cloudant database not found");
  }

  //database name
  var dbVirtualProfessor = 'professor-virtual-engenharia-software-virtual-professor';
  var dbUser = 'professor-virtual-engenharia-software-users';
  var dbConversationRecord =  'professor-virtual-engenharia-software-conversation-record';

  //Create the database.
  cloudant.db.create(dbVirtualProfessor, function(err, data) {
    if(!err) //err if database doesn't already exists
      console.log("Created database: " + dbVirtualProfessor);
  });

  cloudant.db.create(dbUser, function(err, data) {
    if(!err) //err if database doesn't already exists
      console.log("Created database: " + dbUser);
  });

  cloudant.db.create(dbConversationRecord, function(err, data) {
    if(!err) //err if database doesn't already exists
      console.log("Created database: " + dbConversationRecord);
  });



  // Specify the database we are going to use (mydb)...
  myVirtualProfessor = cloudant.db.use(dbVirtualProfessor);
  myUsers = cloudant.db.use(dbUser);
  myConversationRecord = cloudant.db.use(dbConversationRecord);
}
// Check if email and password  exist on database
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

  // Check if email already exists on database
   app.post("/api/createNewUser", function (request, response) {

     if(!myUsers) {
       console.log("No database.");
       response.send("No database.");
       return;
     }
    var email = request.body.email;
    var status = false;
    myUsers.list({ include_docs: true }, function(err, body) {
      if (!err) {
        body.rows.forEach(function(row) {
          if(row.doc.email == email)
              status = true;
        });
        if (status == false){
          myUsers.insert(request.body, function(err, body) {
            if (!err){
              var queryVirtualProfessor =
              {
                "userEmail": request.body.email,
                "virtualProfessorName": "Fernando",
                "userNickName": request.body.firstName,
                "virtualProfessorGender": "male",
                "userDifficultyLevel": "0",
                "userResponseType": "0"
              };
              myVirtualProfessor.insert(queryVirtualProfessor, function(err, body) {
                if (!err)
                  response.send(true);
                else{
                  console.log(err);
                  response.send(err);
                }
              });
            }else{
              console.log(err);
              response.send(err);
            }
          });
        }else {
          response.send(false);
        }
      }
    });

    // myUsers.insert(request.query, function(err, body) {
    //   if (!err)
    //     response.send(true);
    //   else{
    //     console.log(err);
    //     response.send(false);
    //   }
    // });
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

//Get virtual professor data
app.get('/api/getVirtualProfessorInformation', function(request,response) {
  var info = [];

  if (request.sessionprofessorvirtual.email) { // Check if session exists
    myUsers.list({ include_docs: true }, function(err, body) {
      if (!err) {
        body.rows.forEach(function(row) {
          //First check it the user have access
          if(row.doc.email == request.sessionprofessorvirtual.email){
            if (row.doc.password == request.sessionprofessorvirtual.password){
              //Now it can get the user data
              myVirtualProfessor.list({ include_docs: true }, function(err, body) {
                 if (!err) {
                    body.rows.forEach(function(row2) {
                        if(row2.doc.userEmail == request.sessionprofessorvirtual.email){
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

//Get conversation record data
app.get('/api/getConversationRecord', function(request,response) {
  var info = [];

  if (request.sessionprofessorvirtual.email) { // Check if session exists
    myUsers.list({ include_docs: true }, function(err, body) {
      if (!err) {
        body.rows.forEach(function(row) {
          //First check it the user have access
          if(row.doc.email == request.sessionprofessorvirtual.email){
            if (row.doc.password == request.sessionprofessorvirtual.password){
              //Now it can get conversation record data
              myConversationRecord.list({ include_docs: true }, function(err, body) {
                 if (!err) {
                    body.rows.forEach(function(row2) {
                        if(row2.doc.userEmail == request.sessionprofessorvirtual.email){
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

//Update user data
app.get('/api/updateUserInformation', function(request,response) {
  myUsers.insert(request.query, function(err, body) {
    if (!err)
      response.send(true);
    else{
      console.log(err);
      response.send(false);
    }
  });
});

//Update virtual professor data
app.get('/api/updateVirtualProfessorInformation', function(request,response) {
  myVirtualProfessor.insert(request.query, function(err, body) {
    if (!err)
      response.send(true);
    else{
      console.log(err);
      response.send(false);
    }
  });
});

//Insert conversation record
app.post('/api/insertConversationRecord', function(request,response) {
  var alreadyExist = false;
  var attempts = 0;
  var _id = null;
  var _rev = null;
  myConversationRecord.list({ include_docs: true }, function(err, body) {
     if (!err) {
        body.rows.forEach(function(row) {
            if(row.doc.userEmail == request.sessionprofessorvirtual.email){
                if(row.doc.userQuestion == request.body.userQuestion){
                  alreadyExist = true;
                  attempts = Number(row.doc.attempts);
                  _id = row.doc._id;
                  _rev = row.doc._rev;
                }
            }
        });
        if (alreadyExist == false){
          var query = {
            "userEmail": request.sessionprofessorvirtual.email,
            "userQuestion": request.body.userQuestion,
            "virtualProfessorConfidence": Number(request.body.virtualProfessorConfidence),
            "attempts": 1
          }
          myConversationRecord.insert(query, function(err, body) {
            if (!err)
              response.send(true);
            else{
              console.log(err);
              response.send(false);
            }
          });
        } else {
          var query = {
            "_id": _id,
            "_rev": _rev,
            "userEmail": request.sessionprofessorvirtual.email,
            "userQuestion": request.body.userQuestion,
            "virtualProfessorConfidence": Number (request.body.virtualProfessorConfidence),
            "attempts": (attempts+1)
          }
          myConversationRecord.insert(query, function(err, body) {
            if (!err)
              response.send(true);
            else{
              console.log(err);
              response.send(false);
            }
          });
        }

      }

    });
  });


app.listen(serverPort, function () {
  console.log('App listening on port %d!',serverPort)
})
