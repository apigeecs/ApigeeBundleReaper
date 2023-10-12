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
const debug = require("debug")(`findUndeployedProxies`);

async function test(options){
  let response = await utils.getGoogleAccessToken();
}

async function process(options){
  //Get the list of all proxies in the org
  let allProxies=[];
  let allProxiesResponse = await utils.callMgmtAPI('get', `/v1/organizations/${options.organization}/apis`, options.token);
  for (const proxy of allProxiesResponse.proxies){
    allProxies.push(proxy.name);
  }
  let envs = [];
  if(options.environment == "all"){
    //Get the list of Environments in the Org
    envs = await utils.callMgmtAPI('get', `/v1/organizations/${options.organization}/environments`,options.token);
  }else
    envs = [options.environment];
  debug(`envs: ${envs}`);
  for (const env of envs){
    let deployedProxies = []; undeployedProxies=[];
    //Get the list of deployed proxies
    let proxyDeployments = await utils.callMgmtAPI('get', `/v1/organizations/${options.organization}/environments/${env}/deployments`,options.token);
    if(proxyDeployments.deployments){
      for (const proxy of proxyDeployments.deployments){
        deployedProxies.push(proxy.apiProxy);
      }
    }
    console.log(`Proxies deployed in ${env}: ${deployedProxies}`);
    debug(`Proxies deployed in ${env}: ${deployedProxies}`);

    undeployedProxies = allProxies.filter(proxy => !deployedProxies.includes(proxy));
    debug(`Undeployed proxies in ${env}: ${undeployedProxies}`);
    console.log(`Undeployed proxies in ${env}: ${undeployedProxies}`);
    console.log("\n----------------------------------------------------------------------------------------------------------------\n");
  }
}

module.exports = {
    test,
    process
};
