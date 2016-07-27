var request = require("request");
var https = require("https");
var _ = require("lodash");
var fs = require("fs");
var jsonfile = require("jsonfile");

//Call Mgmt API
function mgmtAPI(host, path, auth, type){
  return new Promise(function (fulfill, reject){
    var data = "";
    var options = {
      host,
      port: 443,
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

function getMgmtAPI(host, path, auth){
  return mgmtAPI(host, path, auth, "GET");
}

//Get Environments from Org
function getOrgEnvs(host, org, auth, env){
  if(env === "all"){
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
  var allAPIs = getMgmtAPI(host, "/v1/o/"+org+"/apis", auth);
  return allAPIs;
}

//Get Deployed APIs for Each Environment
function getDeployedAPIsForEnv(host, org, env, auth){
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
function getAllDeployedAPIs(host, org, env, auth){
  return getOrgEnvs(host, org, auth, env)
  .then(function(envs){
    var p = Promise.all(envs.map(function(env){
      return getDeployedAPIsForEnv(host, org, env, auth);
    }));
    p.catch(function(e){console.log("Catch handler for getAllDeployedAPIs" + e); return e;});
    return p;
  });
}

//Get Deployment details for API - returns false if the API is not deployed in any of the environments in the org
function getDeploymentStatusForAPI(host, org, auth, api){
  return getMgmtAPI(host, "/v1/o/"+org+"/apis/"+api+"/deployments", auth)
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
function getDeployedRevisionForAPI(host, org, env, auth, api){
  return getMgmtAPI(host, "/v1/o/"+org+"/e/"+env+"/apis/"+api+"/deployments", auth)
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
function undeployAPI(host, org, env, auth, api){
   return getDeployedRevisionForAPI(host, org, env, auth, api)
    .then(function(revision){
      if(revision!=null){
        console.log("Revision: "+ revision+" is getting undeployed for "+ api);
        return mgmtAPI(host, "/v1/o/"+org+"/e/"+env+"/apis/"+api+"/revisions/"+revision+"/deployments", auth, "DELETE")
        .then(function(response){
          console.log(api+ " is undeployed successfully in "+ env);
        });
      }
    });
}

//To delete API
function deleteAPI(host, org, auth, api){
   return getDeploymentStatusForAPI(host, org, auth, api)
    .then(function(status){
      if(!status){
        return mgmtAPI(host, "/v1/o/"+org+"/apis/"+api, auth, "DELETE")
        .then(function(response){
          console.log(api+ " is deleted successfully");
        });
      }else{
        console.log(api+ " cannot be deleted as its running in another environment");
      }
    });
}

//Get Traffic for each environment
function getTraffic(host, org, auth, env, axDays){
  var toDate = new Date();
  var formattedToDate = (toDate.getMonth()+1)+"/"+(toDate.getDate()+1)+"/"+toDate.getFullYear()+"%2000:00";//MM/DD/YYYY%20HH:MM
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

//Undeploy APIs that has no Traffic
var undeployUnusedAPIs = function(aConfig){
  var filePath = "./../output/"+"api-traffic-status"+"-"+aConfig.org+".json";
  var environments = jsonfile.readFileSync(filePath);
  environments.forEach(function(environment) {
    (environment.apis.noTraffic).forEach(function (api){
      //console.log(api);
      undeployAPI(aConfig.host, aConfig.org, environment.env, aConfig.auth, api);
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
      deleteAPI(aConfig.host, aConfig.org, aConfig.auth, api);
    });
  });
};

//Get the Deployment Status for a given org, environment and export it to a file
var exportAPIDeploymentStatus = function(aConfig){
  getOrgEnvs(aConfig.host, aConfig.org, aConfig.auth, aConfig.env)
  .then(function(envs){
    var p = Promise.all(envs.map(function(env){
      return getDeployedAPIsForEnv(aConfig.host, aConfig.org, env, aConfig.auth);
    }));
    p.catch(function(e){console.log("Catch handler for exportAPIDeploymentStatus" + e); return e;});
    return p;
  })
  .then(function(allDeployedAPIs){
    return getAllAPIs(aConfig.host, aConfig.org, aConfig.auth)
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
  getOrgEnvs(aConfig.host, aConfig.org, aConfig.auth, aConfig.env)
  .then(function(envs){
    var p = Promise.all(envs.map(function(env){
      return getTraffic(aConfig.host, aConfig.org, aConfig.auth, env, aConfig.axDays);
    }));
    p.catch(function(e){console.log("Catch handler exportAPITrafficStatus" + e); return e;});
    return p;
  })
  .then(function(allTrafficAPIs){
    //return getAllAPIs(aConfig.host, aConfig.org, aConfig.auth)
    return getAllDeployedAPIs(aConfig.host, aConfig.org, aConfig.env, aConfig.auth)
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
    undeployUnusedAPIs
    //downloadNoTrafficAPIBundles,
    //downloadUnDeployedAPIBundles
};
