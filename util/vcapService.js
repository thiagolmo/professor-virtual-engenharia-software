let vcapServices;

if(process.env.VCAP_SERVICES)
    vcapServices = JSON.parse(process.env.VCAP_SERVICES);
else
    vcapServices = require("../vcap.json");

module.exports = vcapServices;
