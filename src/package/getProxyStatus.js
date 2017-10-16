var request = require("request");
var https;
var _ = require("lodash");
var fs = require("fs");
var jsonfile = require("jsonfile");
var json2csv = require("json2csv");

//Call Mgmt API
//exports.mgmtAPI = function(host, port, path, auth, type){
function mgmtAPI(proto, host, port, path, auth, type){
  if(proto === "http")
    https = require("http");
  else
    https = require ("https");
  return new Promise(function (fulfill, reject){
    var data = "";
    var options = {
      host,
      port,
      path,
      method: type,
      headers: {
          Accept: "application/json",
          Authorization: auth
      }
    };
    var req = https.request(options, function(res) {
      if (res.statusCode >= 400 && res.statusCode <= 499) {
        console.error(res.statusCode + ": " + res.statusMessage + " with " + JSON.stringify(options));
        //throw new Error(res.statusCode + ": " + res.statusMessage + " with " + JSON.stringify(options));
      }
      if (res.statusCode >= 500) {
        console.error(res.statusCode + ": " + res.statusMessage + " with " + JSON.stringify(options));
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
 
function getMgmtAPI(proto, host, port, path, auth){
  return mgmtAPI(proto, host, port, path, auth, "GET");
}

//Get Environments from Org
function getOrgEnvs(proto, host, port, org, auth, env){
  if(env === "all"){
    return getMgmtAPI(proto, host, port, "/v1/o/"+org+"/e", auth);
  }
  else{
    return new Promise(function(fulfill, reject){
      fulfill([env]);
    });
  }
}

//Get All APIs from Org
function getAllAPIs(proto, host, port, org, auth){
  var allAPIs = getMgmtAPI(proto, host, port, "/v1/o/"+org+"/apis", auth);
  return allAPIs;
}

//Get Deployed APIs for Each Environment
function getDeployedAPIsForEnv(proto, host, port, org, env, auth){
  return getMgmtAPI(proto, host, port, "/v1/o/"+org+"/e/"+env+"/deployments", auth)
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
  .catch(function(e){
    console.error("Catch handler getDeployedAPIsForEnv" + e);
    var deployedApis = {};
    deployedApis.apis = {};
    deployedApis.apis.error = true;
    deployedApis.apis.deployed = {};
    return deployedApis;
  });
}

//Get All Deployed APIs in Org
function getAllDeployedAPIs(proto, host, port, org, env, auth){
  return getOrgEnvs(proto, host, port, org, auth, env)
  .then(function(envs){
    var p = Promise.all(envs.map(function(env){
      return getDeployedAPIsForEnv(proto, host, port, org, env, auth);
    }));
    p.catch(function(e){console.log("Catch handler for getAllDeployedAPIs" + e); return e;});
    return p;
  });
}

//Get Deployment details for API - returns false if the API is not deployed in any of the environments in the org
function getDeploymentStatusForAPI(proto, host, port, org, auth, api){
  return getMgmtAPI(proto, host, port, "/v1/o/"+org+"/apis/"+api+"/deployments", auth)
    .then(function(response){
      var status = false;
      var environments = response.environment;
      if(environments!=null && environments.length>0){
        status=true;
      }
      return status;
  })
  .catch(function(e){
    console.error("Catch handler getDeploymentStatusForAPI" + e);
    return false;
  });
}

//Get Deployed revision details for API
function getDeployedRevisionForAPI(proto, host, port, org, env, auth, api){
  return getMgmtAPI(proto, host, port, "/v1/o/"+org+"/e/"+env+"/apis/"+api+"/deployments", auth)
    .then(function(response){
      var revision;
      if(response!=null && response.revision!=null && response.revision.length>0){
        revision = response.revision[0].name;
      }
      return revision;
  })
  .catch(function(e){
    console.error("Catch handler getDeployedRevisionForAPI" + e);
    return null;
  });
}

//To undeploy API
function undeployAPI(proto, host, port, org, env, auth, api){
   return getDeployedRevisionForAPI(proto, host, port, org, env, auth, api)
    .then(function(revision){
      if(revision!=null){
        console.log("Revision: "+ revision+" is getting undeployed for "+ api);
        return mgmtAPI(proto, host, port, "/v1/o/"+org+"/e/"+env+"/apis/"+api+"/revisions/"+revision+"/deployments", auth, "DELETE")
        .then(function(response){
          console.log(api+ " is undeployed successfully in "+ env);
        });
      }
    });
}

//To delete API
function deleteAPI(proto, host, port, org, auth, api){
   return getDeploymentStatusForAPI(proto, host, port, org, auth, api)
    .then(function(status){
      if(!status){
        return mgmtAPI(proto, host, port, "/v1/o/"+org+"/apis/"+api, auth, "DELETE")
        .then(function(response){
          console.log(api+ " is deleted successfully");
        });
      }else{
        console.log(api+ " cannot be deleted as its running in another environment");
      }
    });
}

//Get Traffic for each environment
function getTraffic(proto, host, port, org, auth, env, axDays){
  var toDate = new Date();
  var formattedToDate = (toDate.getMonth()+1)+"/"+(toDate.getDate()+1)+"/"+toDate.getFullYear()+"%2000:00";//MM/DD/YYYY%20HH:MM
  var fromDate = new Date(toDate - (axDays*24*3600*1000));
  var formattedFromDate = (fromDate.getMonth()+1)+"/"+fromDate.getDate()+"/"+fromDate.getFullYear()+"%2000:00";//MM/DD/YYYY%20HH:MM
  var calledAPIs ={};
  return getMgmtAPI(proto, host, port, "/v1/o/"+org+"/e/"+env+"/stats/apis?select=sum(message_count)&timeUnit=day&timeRange="+formattedFromDate+"~"+formattedToDate, auth)
    .then(function(response){
    var environments = response.environments;
    calledAPIs.env = env;
    environments.forEach(function(environment) {
      var dimensions = environment.dimensions;
      var api = [];
      if(dimensions!=null && dimensions.length>0){
        dimensions.forEach(function(dimension) {
          var count = 0;
          var metrics = dimension.metrics;
          metrics.forEach(function(metric){
            var values = metric.values;
            values.forEach(function(value){
              count = count+parseInt(value.value);
            })
          });
          //console.log(org+"\t\t"+env+"\t\t"+dimension.name+"\t\t"+count);
          api.push(dimension.name);
        });
      }
      calledAPIs.apis = {};
      calledAPIs.apis.traffic = api;
    });
    return calledAPIs;
  })
  .catch(function (e){
    console.error(e);
    calledAPIs.apis = {};
    calledAPIs.apis.error = true;
    calledAPIs.apis.traffic = {};
    return calledAPIs;
  });
}

//Export response to file
function exportToFile(apis, fileName, org){
  var filePath = "./../output/"+fileName+"-"+org+".json";
  console.log("Writing to a file : "+filePath);
  jsonfile.writeFileSync(filePath, apis, {spaces: 2});
}

//Export to CSV
function exportUnUsedAPIsToCSVFile(apis, fileName, org){
  //var readPath = "./../output/api-traffic-status-saisarantest.json";
  //var apis = jsonfile.readFileSync(readPath);
  //console.log(JSON.stringify(apis));

  var noTrafficAPIs = [];

  if(apis!=null && apis.length>0){
    apis.forEach(function(api) {
      var env = api.env;
      (api.apis.noTraffic).forEach(function(noTApi){
        var noTrafficAPI = {
          org,
          env,
          name: noTApi
        };
        noTrafficAPIs.push(noTrafficAPI);
      });
    });
  }

  var filePath = "./../output/"+fileName+"-"+org+".csv";
  console.log("Writing to a file : "+filePath);
  var fields = ["org", "env", "name"];
  var csv = json2csv(
      { 
        data: noTrafficAPIs,
        fields
      }
    );
  fs.writeFile(filePath, csv, function(err) {
    if (err){
      throw err;
    }
    console.log("CSV file saved");
  });
}

//Undeploy APIs that has no Traffic
var undeployUnusedAPIs = function(aConfig){
  var filePath = "./../output/"+"api-traffic-status"+"-"+aConfig.org+".json";
  var environments = jsonfile.readFileSync(filePath);
  environments.forEach(function(environment) {
    (environment.apis.noTraffic).forEach(function (api){
      //console.log(api);
      undeployAPI(aConfig.proto, aConfig.host, aConfig.port, aConfig.org, environment.env, aConfig.auth, api);
    });
  });
};

//Delete Undeployed APIs
var deleteUnDeployedAPIs = function(aConfig){
  var filePath = "./../output/"+"api-deployment-status"+"-"+aConfig.org+".json";
  var environments = jsonfile.readFileSync(filePath);
  environments.forEach(function(environment) {
    (environment.apis.undeployed).forEach(function (api){
      //console.log(api);
      deleteAPI(aConfig.proto, aConfig.host, aConfig.port, aConfig.org, aConfig.auth, api);
    });
  });
};

//Get the Deployment Status for a given org, environment and export it to a file
var exportAPIDeploymentStatus = function(aConfig){
  getOrgEnvs(aConfig.proto, aConfig.host, aConfig.port, aConfig.org, aConfig.auth, aConfig.env)
  .then(function(envs){
    var p = Promise.all(envs.map(function(env){
      return getDeployedAPIsForEnv(aConfig.proto, aConfig.host, aConfig.port, aConfig.org, env, aConfig.auth);
    }));
    p.catch(function(e){console.log("Catch handler for exportAPIDeploymentStatus" + e); return e;});
    return p;
  })
  .then(function(allDeployedAPIs){
    return getAllAPIs(aConfig.proto, aConfig.host, aConfig.port, aConfig.org, aConfig.auth)
    .then(function(allAPIs){
      for(var i = 0; i < allDeployedAPIs.length; i++){
        if(!allDeployedAPIs[i].apis.error){
          allDeployedAPIs[i].apis.undeployed = _.difference(allAPIs, allDeployedAPIs[i].apis.deployed);
          //allDeployedAPIs[i].apis.all = allAPIs;
          if(allDeployedAPIs[i].apis.undeployed!==null && allDeployedAPIs[i].apis.undeployed.length>0){
            console.log("There are "+allDeployedAPIs[i].apis.undeployed.length+" un-deployed proxies");
            console.log("-------------------------Undeployed APIs in "+allDeployedAPIs[i].env+"-----------------------------");
            for (var j = allDeployedAPIs[i].apis.undeployed.length - 1; j >= 0; j--) {
                console.log(allDeployedAPIs[i].apis.undeployed[j]);
              }
            console.log("-----------------------------------------------------------------------------");
          }
        }
      }
      return allDeployedAPIs;
    })
    .catch(function(e){console.log("Catch handler exportAPIDeploymentStatus-allAPIs" + e); return e;});
  })
  .then(function (allAPIStatusInfo){
    exportToFile(allAPIStatusInfo, "api-deployment-status", aConfig.org);
    return allAPIStatusInfo;
  })
  .then(function(){
    if(aConfig.deleteUndeployed !== null && aConfig.deleteUndeployed ==="yes"){
      deleteUnDeployedAPIs(aConfig);
    }
    return "";
  })
  .catch(function(e){console.log("Catch handler exportAPIDeploymentStatus" + e); return e;});
};

//Get the Traffic Status for a given org, environment and export it to a file
var exportAPITrafficStatus = function(aConfig){
  getOrgEnvs(aConfig.proto, aConfig.host, aConfig.port, aConfig.org, aConfig.auth, aConfig.env)
  .then(function(envs){
    var p = Promise.all(envs.map(function(env){
      return getTraffic(aConfig.proto, aConfig.host, aConfig.port, aConfig.org, aConfig.auth, env, aConfig.axDays);
    }));
    p.catch(function(e){console.log("Catch handler exportAPITrafficStatus" + e); return e;});
    return p;
  })
  .then(function(allTrafficAPIs){
    //return getAllAPIs(aConfig.host, aConfig.port, aConfig.port, aConfig.org, aConfig.auth)
    return getAllDeployedAPIs(aConfig.proto, aConfig.host, aConfig.port, aConfig.org, aConfig.env, aConfig.auth)
    .then(function(allDeployedAPIs){
      //console.log("allDeployedAPIs: "+JSON.stringify(allDeployedAPIs));
      //console.log("allTrafficAPIs: "+JSON.stringify(allTrafficAPIs));
      for(var i = 0; i < allTrafficAPIs.length; i++){
        if(!allTrafficAPIs[i].apis.error){
          allTrafficAPIs[i].apis.noTraffic = {};
          if(allDeployedAPIs[i].apis!=null && allDeployedAPIs[i].apis.deployed!=null && allDeployedAPIs[i].apis.deployed.length>0){
            var temp = allTrafficAPIs[i].apis.traffic;
            allTrafficAPIs[i].apis.traffic = {};
            allTrafficAPIs[i].apis.noTraffic = _.difference(allDeployedAPIs[i].apis.deployed, temp);
            allTrafficAPIs[i].apis.traffic = _.intersection(allDeployedAPIs[i].apis.deployed, temp);
          }
          else{
            allTrafficAPIs[i].apis.noTraffic = [];
            allTrafficAPIs[i].apis.traffic = [];
          }
          if(allTrafficAPIs[i].apis.noTraffic!=null && allTrafficAPIs[i].apis.noTraffic.length>0){
            console.log("There are "+allTrafficAPIs[i].apis.noTraffic.length+" proxies with no traffic");
              console.log("--------------APIs with No Traffic in "+allTrafficAPIs[i].env+" in the last "+aConfig.axDays+" days---------------");
              for (var j = allTrafficAPIs[i].apis.noTraffic.length - 1; j >= 0; j--) {
                console.log(allTrafficAPIs[i].apis.noTraffic[j]);
              }
            console.log("-----------------------------------------------------------------------------");
          }
        }
      }
      return allTrafficAPIs;
    })
    .catch(function(e){console.log("Catch handler exportAPITrafficStatus - allDeployedAPIs" + e); return e;});
  })
  .then(function(apis){
    exportToFile(apis, "api-traffic-status", aConfig.org);
    exportUnUsedAPIsToCSVFile(apis, "api-noTraffic-status", aConfig.org);
    return apis;
  })
  .then(function(){
    if(aConfig.undeployUnused !== null && aConfig.undeployUnused ==="yes"){
      undeployUnusedAPIs(aConfig);
    }
    return "";
  })
  .catch(function(e){console.log("Catch handler exportAPITrafficStatus - allTrafficAPIs" + e); return e;});
};

/*var downloadNoTrafficAPIBundles = function(aConfig){
  var apis = jsonfile.readFileSync(aConfig.file);
  console.log(JSON.stringify(apis));
}

var downloadUnDeployedAPIBundles = function(aConfig){
  //console.log(jsonfile.readFileSync(aConfig.file));
}*/

module.exports = {
    exportAPITrafficStatus,
    exportAPIDeploymentStatus,
    deleteUnDeployedAPIs,
    undeployUnusedAPIs,
    exportUnUsedAPIsToCSVFile
    //downloadNoTrafficAPIBundles,
    //downloadUnDeployedAPIBundles
};
