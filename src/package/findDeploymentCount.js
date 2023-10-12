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
const debug = require("debug")(`findDeploymentCount`);

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
  if(options.environment == "all"){
    //Get the list of Environments in the Org
    envs = await utils.callMgmtAPI('get', `/v1/organizations/${options.organization}/environments`,options.token, options.serviceAccount);
  }else
    envs = [options.environment];
  debug(`envs: ${envs}`);
  for (const env of envs){
    let deployedProxies = [], deployedSharedFlows = [];
    //Get the list of deployed proxies
    let proxyDeployments = await utils.callMgmtAPI('get', `/v1/organizations/${options.organization}/environments/${env}/deployments?sharedFlows=false`,options.token, options.serviceAccount);
    if(proxyDeployments.deployments){
      for (const proxy of proxyDeployments.deployments){
        deployedProxies.push(proxy.apiProxy);
      }
    }
    //Get the list of deployed sharedFlows
    let shardFlowDeployments = await utils.callMgmtAPI('get', `/v1/organizations/${options.organization}/environments/${env}/deployments?sharedFlows=true`,options.token, options.serviceAccount);
    if(shardFlowDeployments.deployments){
      for (const sharedFlow of shardFlowDeployments.deployments){
        deployedSharedFlows.push(sharedFlow.apiProxy);
      }
    }
    console.log(`Number of proxies deployed in ${env}: ${deployedProxies.length}`);
    console.log(`Number of sharedflows deployed in ${env}: ${deployedSharedFlows.length}`);
    console.log("\n----------------------------------------------------------------------------------------------------------------\n");
  }
}

module.exports = {
    //test,
    process
};
