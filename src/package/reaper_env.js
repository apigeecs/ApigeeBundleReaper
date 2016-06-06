var prompt = require("prompt");
var request = require("request");
var https = require("https");
var _ = require("lodash");

  var mgmtAPIConfigurations = {
  	host: "api.enterprise.apigee.com",
  	version: "v1"
  }

  var properties = [
    {
      description: "Please provide Org Name",
      name: "org",
      required: true,
      message: "Must not be empty"
    },
    {
      description: "Please provide Env Name",
      name: "env",
      required: true,
      default: "test",
      message: "Must not be empty"
    },
    {
      description: "Please provide number of days",
      name: "axDays",
      type: "integer",
      required: true,
      default: 90,
      message: "Must not be empty and must be a Number"
    },
    {
      description: "Please provide Org User ID",
      name: "orgUserName",
      required: true,
      message: "Must not be empty"
    },
    {
      description: "Please provide Org User Password",
      name: "orgUserPwd",
      required: true,
      hidden: true,
      message: "Must not be empty"
    }
  ];

  function getAllAPIs(result){
    var data = "";

    var options = {
        host: "api.enterprise.apigee.com",
        port: 443,
        path: "/"+mgmtAPIConfigurations.version+"/organizations/"+result.org+"/apis",
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: "Basic " + (new Buffer(result.orgUserName + ":" + result.orgUserPwd)).toString("base64")
        }
    };

    var req = https.request(options, function(res) {
        res.on("data", function(d) {
            data += d;
        });
        res.on("end", function() {
          //Nothing to do
          var allApis = JSON.parse(data);
          getDeployedAPIs(result, allApis);
        });
    });

    req.on("error", function(e) {
        console.error(e);
    });
    
    req.end();
    
  }

  function getDeployedAPIs(result, allApis){
    var data = "";

    var options = {
        host: "api.enterprise.apigee.com",
        port: 443,
        path: "/"+mgmtAPIConfigurations.version+"/organizations/"+result.org+"/environments/"+result.env+"/deployments",
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: "Basic " + (new Buffer(result.orgUserName + ":" + result.orgUserPwd)).toString("base64")
        }
    };
    var req = https.request(options, function(res) {
        res.on("data", function(d) {
            data += d;
        });
        res.on("end", function() {
          //console.log(JSON.parse(data).aPIProxy.length);
          var apiProxies = JSON.parse(data).aPIProxy;
          var deployedApis = [];
          for(var i = 0; i<apiProxies.length; i++){
            deployedApis[i] = apiProxies[i].name;
          }
          var undeployedApis = _.difference(allApis, deployedApis);
          if(undeployedApis!==null && undeployedApis.length > 0){
            console.log("-------------------------Undeployed APIs in "+result.env+"-----------------------------");
            undeployedApis.forEach(function(api) {
              console.log(api);
            });
            console.log("-----------------------------------------------------------------------------");
          }
          getTraffic(result, allApis);
        });
    });
    req.on("error", function(e) {
        console.error(e);
    });
    req.end();
  }

  function getTraffic(result, allApis){
    var toDate = new Date();
    var formattedToDate = (toDate.getMonth()+1)+"/"+toDate.getDate()+"/"+toDate.getFullYear()+"%2000:00";//MM/DD/YYYY%20HH:MM
    //console.log(formattedToDate);
    var fromDate = new Date(toDate - (result.axDays*24*3600*1000));
    var formattedFromDate = (fromDate.getMonth()+1)+"/"+fromDate.getDate()+"/"+fromDate.getFullYear()+"%2000:00";//MM/DD/YYYY%20HH:MM
    //  console.log(formattedFromDate);
    var data = "";
    var calledApis = [];
    var options = {
        host: "api.enterprise.apigee.com",
        port: 443,
        path: "/"+mgmtAPIConfigurations.version+"/organizations/"+result.org+"/environments/"+result.env+"/stats/apis?select=sum(message_count)&timeUnit=day&timeRange="+formattedFromDate+"~"+formattedToDate,
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: "Basic " + (new Buffer(result.orgUserName + ":" + result.orgUserPwd)).toString("base64")
        }
    };

    var req = https.request(options, function(res) {
        res.on("data", function(d) {
            data += d;
        });
        res.on("end", function() {
          var environments = JSON.parse(data).environments;
          environments.forEach(function(environment) {
              var dimensions = environment.dimensions;
              if(dimensions!=null && dimensions.length>0){
                dimensions.forEach(function(dimension) {
                  calledApis.push(dimension.name);
                })
              }
            })
          var unusedApis = _.difference(allApis, calledApis);
          if(unusedApis!=null && unusedApis.length > 0){
            console.log("--------------APIs with No Traffic in "+result.env+" in the last "+result.axDays+" days---------------");
            unusedApis.forEach(function(api) {
              console.log(api);
            });
            console.log("-----------------------------------------------------------------------------");
          }
        });
    });
    req.on("error", function(e) {
        console.error(e);
    });
    req.end();

  }


  prompt.start();

  prompt.get(properties, function (err, result) {
    if (err) { 
    	return onErr(err); 
    } else {
    	//printInfo(result);
      getAllAPIs(result);
    }
  });

  function onErr(err) {
    console.log(err);
    return -1;
   }

  function printInfo(result) {
    console.log("Command-line input received:");
    console.log("  Org: " + result.org);
    console.log("  Env: " + result.env);
    console.log("  AX Days: " + result.axDays);
    console.log("  Username: " + result.orgUserName);
    console.log("  Password: " + result.orgUserPwd);
    return 1;
  }
