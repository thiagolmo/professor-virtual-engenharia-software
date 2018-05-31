var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser');
var session = require('client-sessions');
const router = express.Router();


var vcapLocal;

try {
  vcapLocal = require('./vcap-local.json');
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}

const appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.services['cloudantNoSQLDB'] || appEnv.getService(/cloudant/)) {
  // Load the Cloudant library.
  var Cloudant = require('cloudant','cloudant-promise');

  // Initialize database with credentials
  if (appEnv.services['cloudantNoSQLDB']) {
     // CF service named 'cloudantNoSQLDB'
     var cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);
  } else {
     // user-provided service with 'cloudant' in its name
     var cloudant = Cloudant(appEnv.getService(/cloudant/).credentials);
  }

  myUsers = cloudant.db.use(dbUser);

}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


var email;
var password;
var user = [];
var status = false;


router.post('/checkUser', (request, response) => {
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
        response.send(false);
      }
      }
    });
  });


  //checkEmailAndPassword(email,password);

 //console.log("test");
  //   myUsers.list({ include_docs: true }, function(err, body) {
  //   if (!err) {
  //     body.rows.forEach(function(row) {
  //       if(row.doc.email == email)
  //         if (row.doc.password == password){
  //           return true;
  //           console.log("test");
  //         }
  //     });
  //   }
  //   callback(err, data);
  // });





//console.log( checkEmailAndPassword(email, password));
  //console.log(await checkEmailAndPassword(email, password));
 //console.log(user);



  //});

   // function checkEmailAndPassword (email,password){
   //
   //   myUsers.list(function(err, body) {
   //     if (!err) {
   //       body.rows.forEach(function(doc) {
   //       console.log(doc);
   //       });
   //    }
   //
   //  })
   //  .then(body => console.log(body))
   //  .catch(err => console.error(err));
   //
      // myUsers.list({ include_docs: true }, function(err, body, callback) {
      //   if (!err) {
      //     body.rows.forEach(function(row) {
      //       if(row.doc.email == email)
      //         if (row.doc.password == password){
      //           user.push(row.doc.email);
      //           status = true;
      //
      //         }
      //     });
      //   }
      //
      //   if (status == true){
      //       return callback(null, true);
      //     //  request.sessionprofessorvirtual = { 'email': email, 'password': password};
      //   //    response.send({'login': 'ok'});
      //   }else {
      //     return callback(null, false);
      //     //  request.sessionprofessorvirtual = { 'email': email, 'password': password};
      //   //    response.send({'login': 'nok'});
      //     //return false;
      //   }
      //
      // });

    // }

  //Check user and email on database
//   myUsers.list({ include_docs: true }, function(err, body) {
//     if (!err) {
//       body.rows.forEach(function(row) {
//         if(row.doc.email == email)
//           if (row.doc.password == password){
//             user.push(row.doc.email);
//             console.log (user);
//           }else {
//             status = false;
//           }
//       });
//   }
//
//   if (status == true)
//     status = true;
//   else
//     status = false;
//
//   });
//   console.log (user);
//   if (status == true){
//     console.log(status);
//     request.sessionprofessorvirtual = { 'email': email, 'password': password};
//     response.send({'login': 'ok'});
//   }else {
//     request.sessionprofessorvirtual = { 'email': email, 'password': password};
//     response.send({'login': 'nok'});
//   }
//
//
// });


// app.post("/api/login", function (request, response) {
//   var email = request.body.email;
//   var password = request.body.password;
//
//   if(!myUsers) {
//     console.log("No database.");
//     response.send("No database.");
//     return;
//   }
//   var status = false;
//   myUsers.list({ include_docs: true }, function(err, body) {
//     if (!err) {
//       body.rows.forEach(function(row) {
//         if(row.doc.userEmail == email)
//           if (row.doc.userPassword == password){
//             request.session.user = email;
//             request.session.password = password;
//             status = true;
//           }
//       });
//       if (status == true)
//         response.send(true);
//       else {
//         request.session.user = email;
//         request.session.password = password;
//         response.send(false);
//       }
//       }
//     });
//   });

  app.get('/validSession', function(request, response) {
  var status = false;
  if ( request.session.user) { // Check if session exists
    myUsers.list({ include_docs: true }, function(err, body) {
      if (!err) {
        body.rows.forEach(function(row) {
          if(row.doc.userEmail == request.session.user)
            if (row.doc.userPassword == request.session.password){
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

app.get('/destroySession', function(request,response) {
  request.session.destroy(function(err) {
    response.send(false);
  })
  response.send(true);
});



module.exports = router;

// $("#idSubmitLogin").click(function(){
//   email = document.getElementById('inputEmail').value;
//   password = document.getElementById('inputPassword').value;
//   //POST request to API to create a new visitor entry in the database
//   $.ajax({
// 				  method: "POST",
// 				  url: "./routes/login",
// 				  contentType: "application/json",
// 				  data: JSON.stringify({email: email,
//                                 password:password},
//           )
// 				})
//                 .done(function(data) {
//                   console.log(data);
//                   if (data == true)
//                     $(location).attr('href', '/chat.html')
//                   else{
//                     document.getElementById('idAlertUserPasswordInvalid').style.display = 'inline';
//                     document.getElementById('idSpace').style.display = 'inline';}
//                 });
// });
