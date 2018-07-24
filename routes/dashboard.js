var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser');
var session = require('client-sessions');
const router = express.Router();


// var vcapLocal;
//
// try {
//   vcapLocal = require('./vcap.json');
//   console.log("Loaded local VCAP", vcapLocal);
// } catch (e) { }
//
// //const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}
//
// //const appEnv = cfenv.getAppEnv(appEnvOpts);
//
// console.log(vcapLocal);
//
//
// if (vcapLocal.cloudantNoSQLDB[0]) {
//   // Load the Cloudant library.
//   var Cloudant = require('cloudant');
//
//   // Initialize database with credentials
//   if (vcapLocal.cloudantNoSQLDB[0]) {
//      var cloudant = Cloudant(vcapLocal.cloudantNoSQLDB[0].credentials);
//   } else {
//      console.log("Cloudant database not found");
//   }
//
//   myUsers = cloudant.db.use(dbUser);
// }

// try {
//   vcapLocal = require('./vcap-local.json');
//   console.log("Loaded local VCAP", vcapLocal);
// } catch (e) { }
//
// const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}
//
// const appEnv = cfenv.getAppEnv(appEnvOpts);
//
// if (appEnv.services['cloudantNoSQLDB'] || appEnv.getService(/cloudant/)) {
//   // Load the Cloudant library.
//   var Cloudant = require('cloudant','cloudant-promise');
//
//   // Initialize database with credentials
//   if (appEnv.services['cloudantNoSQLDB']) {
//      // CF service named 'cloudantNoSQLDB'
//      var cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);
//   } else {
//      // user-provided service with 'cloudant' in its name
//      var cloudant = Cloudant(appEnv.getService(/cloudant/).credentials);
//   }
//
//   myUsers = cloudant.db.use(dbUser);
//
// }

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


var email;
var password;

function getSessionUser(){
  app.get('/api/getSession',
    function (response) {
      console.log(response);
      return response;
  });
}

router.get('/getBasicUserInformation', (request, response) => {
    console.log(getSessionUser());
});



module.exports = router;
