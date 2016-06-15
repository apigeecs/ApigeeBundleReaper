var request = require("request");
var https = require("https");
var _ = require("lodash");
var fs = require("fs");
var jsonfile = require('jsonfile');

//Call Mgmt API
function getMgmtAPI(host, path, auth){
  return new Promise(function (fulfill, reject){
    var data = "";
    var options = {
      host: host,
      port: 443,
      path: path,
      method: "GET",
      headers: {
          Accept: "application/json",
          Authorization: auth
          //Authorization: "Basic c3N2YWlkeWFuYXRoYW5AYXBpZ2VlLmNvbTpUZWphczE4MDEyMDEy"
      }
    };
    var req = https.request(options, function(res) {
      if (res.statusCode >= 300) {
        console.error(res.statusCode + ": " + res.statusMessage + " with " + JSON.stringify(options));
        throw new Error(res.statusCode + ": " + res.statusMessage + " with " + JSON.stringify(options));
      }
      res.on("data", function(d) {
          data += d;
      });
      res.on("end", function(){
        fulfill(JSON.parse(data));
      });
    });

    req.on("error", function(e) {
      console.error(e);
    });

    req.end();
  });
}

//Get Environments from Org
function getOrgEnvs(host, org, auth, env){
  if(env == "all"){
    return getMgmtAPI(host, "/v1/o/"+org+"/e", auth);
  }
  else{
    return new Promise(function(fulfill, reject){
      fulfill([env]);
    });
  }
}

//Get All APIs from Org
function getAllAPIs(host, org, auth){
  return getMgmtAPI(host, "/v1/o/"+org+"/apis", auth);
}

//Get Deployed APIs from Each Environment
function getDeployedAPIs(host, org, auth, env){
  return getMgmtAPI(host, "/v1/o/"+org+"/e/"+env+"/deployments", auth)
    .then(function(response){
      var deployedApis = {};
      deployedApis.env = response.name;
      var apiProxies = response.aPIProxy;
      var apis = [];
      for(var i = 0; i < apiProxies.length; i++){
        apis[i] = apiProxies[i].name;
      }
      deployedApis.apis = {};
      deployedApis.apis.deployed = apis;
      return deployedApis;
  })
  .catch(function(e){console.log("Catch handler 4" + e); return e});
}

//Get Traffic for each environment
function getTraffic(host, org, auth, env, axDays){
  var toDate = new Date();
  var formattedToDate = (toDate.getMonth()+1)+"/"+toDate.getDate()+"/"+toDate.getFullYear()+"%2000:00";//MM/DD/YYYY%20HH:MM
  var fromDate = new Date(toDate - (axDays*24*3600*1000));
  var formattedFromDate = (fromDate.getMonth()+1)+"/"+fromDate.getDate()+"/"+fromDate.getFullYear()+"%2000:00";//MM/DD/YYYY%20HH:MM
  var calledAPIs ={};
  return getMgmtAPI(host, "/v1/o/"+org+"/e/"+env+"/stats/apis?select=sum(message_count)&timeUnit=day&timeRange="+formattedFromDate+"~"+formattedToDate, auth)
    .then(function(response){
    var environments = response.environments;
    calledAPIs.env = env;
    environments.forEach(function(environment) {
      var dimensions = environment.dimensions;
      var api = [];
      if(dimensions!=null && dimensions.length>0){
        dimensions.forEach(function(dimension) {
          api.push(dimension.name);
        });
      }
      calledAPIs.apis = {};
      calledAPIs.apis.traffic = api;
    });
    return calledAPIs;
  });
}

//Export response to file
function exportToFile(apis, fileName){
  var filePath = "./../output/"+fileName+".json";
  console.log("Writing to a file : "+filePath);
  jsonfile.writeFileSync(filePath, apis, {spaces: 2});
}

//Get the Deployment Status for a given org, environment and export it to a file
var exportAPIDeploymentStatus = function(aConfig){
  getOrgEnvs(aConfig.host, aConfig.org, aConfig.auth, aConfig.env)
  .then(function(envs){
    var p = Promise.all(envs.map(function(env){
      return getDeployedAPIs(aConfig.host, aConfig.org, aConfig.auth, env);
    }));
    p.catch(function(e){console.log("Catch handler 1" + e); return e;});
    return p;
  })
  .then(function(allDeployedAPIs){
    return getAllAPIs(aConfig.host, aConfig.org, aConfig.auth)
    .then(function(allAPIs){
      for(var i = 0; i < allDeployedAPIs.length; i++){
        allDeployedAPIs[i].apis.undeployed = _.difference(allAPIs, allDeployedAPIs[i].apis.deployed);
        //allDeployedAPIs[i].apis.all = allAPIs;
      }
      return allDeployedAPIs;
    })
    .catch(function(e){console.log("Catch handler 2" + e); return e});
  })
  .then(function (allAPIStatusInfo){
    exportToFile(allAPIStatusInfo, "api-deployment-status");
    return allAPIStatusInfo;
  })
  .catch(function(e){console.log("Catch handler 3" + e); return e});
}

//Get the Traffic Status for a given org, environment and export it to a file
var exportAPITrafficStatus = function(aConfig){
  getOrgEnvs(aConfig.host, aConfig.org, aConfig.auth, aConfig.env)
  .then(function(envs){
    var p = Promise.all(envs.map(function(env){
      return getTraffic(aConfig.host, aConfig.org, aConfig.auth, env, aConfig.axDays);
    }));
    p.catch(function(e){console.log("Catch handler 1" + e); return e;});
    return p;
  })
  .then(function(allTrafficAPIs){
    return getAllAPIs(aConfig.host, aConfig.org, aConfig.auth)
    .then(function(allAPIs){
      for(var i = 0; i < allTrafficAPIs.length; i++){
        if(allTrafficAPIs[i].apis!=null && allTrafficAPIs[i].apis.traffic!=null)
          allTrafficAPIs[i].apis.no_traffic = _.difference(allAPIs, allTrafficAPIs[i].apis.traffic);
        else{
          allTrafficAPIs[i].apis.no_traffic = _.difference(allAPIs, []);
        }
      }
      return allTrafficAPIs;
    })
    .catch(function(e){console.log("Catch handler 8" + e); return e});
  })
  .then(function(apis){
    exportToFile(apis, "api-traffic-status");
    return apis;
  })
  .catch(function(e){console.log("Catch handler 7" + e); return e});
}

module.exports = {
    exportAPITrafficStatus,
    exportAPIDeploymentStatus
};
