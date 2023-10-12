/*
  Copyright 2023 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const utils = require("../utils/utils");
const debug = require("debug")(`findProxiesWithoutTraffic`);

// async function test(options){
//   let toDate = new Date();
//   let formattedToDate = (toDate.getMonth()+1)+"/"+(toDate.getDate()+1)+"/"+toDate.getFullYear()+" 00:00";//MM/DD/YYYY HH:MM
//   let fromDate = new Date(toDate - (options.axDays*24*3600*1000));
//   let formattedFromDate = (fromDate.getMonth()+1)+"/"+fromDate.getDate()+"/"+fromDate.getFullYear()+" 00:00";//MM/DD/YYYY HH:MM
  
//   let response = await utils.callMgmtAPI('get', `/v1/organizations/${options.organization}/environments/ayostest/stats/apiproxy?select=sum(message_count)&timeUnit=day&timeRange=${formattedFromDate}~${formattedToDate}`, options.token, options.serviceAccount);
//   console.log(JSON.stringify(response));
// }

async function process(options){
  let envs = [];
  let toDate = new Date();
  let formattedToDate = (toDate.getMonth()+1)+"/"+(toDate.getDate()+1)+"/"+toDate.getFullYear()+" 00:00";//MM/DD/YYYY HH:MM
  let fromDate = new Date(toDate - (options.axDays*24*3600*1000));
  let formattedFromDate = (fromDate.getMonth()+1)+"/"+fromDate.getDate()+"/"+fromDate.getFullYear()+" 00:00";//MM/DD/YYYY HH:MM
  if(options.environment == "all"){
    //Get the list of Environments in the Org
    envs = await utils.callMgmtAPI('get', `/v1/organizations/${options.organization}/environments`,options.token, options.serviceAccount);
  }else
    envs = [options.environment];
  debug(`envs: ${envs}`);
  for (const env of envs){
    let deployedProxies = [], proxiesWithTraffic=[], unUsedProxies=[];
    let undeployProxyMap = new Map(); //map for proxy and revision which will later be used to undeploy
    //Get the list of deployed proxies
    let proxyDeployments = await utils.callMgmtAPI('get', `/v1/organizations/${options.organization}/environments/${env}/deployments`,options.token, options.serviceAccount);
    if(proxyDeployments.deployments){
      for (const proxy of proxyDeployments.deployments){
        deployedProxies.push(proxy.apiProxy);
        undeployProxyMap.set(proxy.apiProxy, proxy.revision);
      }
    }
    debug(`Proxies deployed in ${env}: ${deployedProxies}`);

    //Get the Stats for each environment
    let proxyTraffic = await utils.callMgmtAPI('get', `/v1/organizations/${options.organization}/environments/${env}/stats/apiproxy?select=sum(message_count)&timeUnit=day&timeRange=${formattedFromDate}~${formattedToDate}`, options.token, options.serviceAccount);
    if(proxyTraffic.environments && proxyTraffic.environments[0] && proxyTraffic.environments[0].dimensions){
      for (const dimension of proxyTraffic.environments[0].dimensions){
        proxiesWithTraffic.push(dimension.name);
      }
    }
    debug(`Proxies with Traffic in the last ${options.axDays} days in ${env}: ${proxiesWithTraffic}`);
    unUsedProxies = deployedProxies.filter(deployedProxy => !proxiesWithTraffic.includes(deployedProxy));
    debug(`Proxies with No Traffic in the last ${options.axDays} days in ${env}: ${unUsedProxies}`);
    console.log(`Proxies with No Traffic in the last ${options.axDays} days in ${env}: ${unUsedProxies}`);

    if(options.undeployUnused == "Y"){
      for (const unUsedProxy of unUsedProxies){
        utils.callMgmtAPI('delete', `/v1/organizations/${options.organization}/environments/${env}/apis/${unUsedProxy}/revisions/${undeployProxyMap.get(unUsedProxy)}/deployments`, options.token, options.serviceAccount);
        console.log(`Undeployed Rev ${undeployProxyMap.get(unUsedProxy)} of ${unUsedProxy} in ${env} environment`);
      }
    }

    console.log("\n----------------------------------------------------------------------------------------------------------------\n");
  }
}

module.exports = {
    //test,
    process
};
