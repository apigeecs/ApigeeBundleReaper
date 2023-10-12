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
const debug = require("debug")(`listProxiesWithRevisions`);

async function test(options){
  let response = await utils.callMgmtAPI('get', `/v1/organizations/${options.organization}/sharedflows?includeRevisions=true`, options.token, options.serviceAccount);
  console.log(JSON.stringify(response));
}

async function process(options){
  let allProxiesResponse = await utils.callMgmtAPI('get', `/v1/organizations/${options.organization}/apis?includeRevisions=true`, options.token, options.serviceAccount);
  if(allProxiesResponse.proxies){
    for (const proxy of allProxiesResponse.proxies){
      if(proxy.revision && proxy.revision.length>=options.revisions)
        console.log(`Proxy: ${proxy.name} has ${proxy.revision.length} revisions`)
    }
  }
  console.log("\n----------------------------------------------------------------------------------------------------------------\n");
  let allSharedFlowResponse = await utils.callMgmtAPI('get', `/v1/organizations/${options.organization}/sharedflows?includeRevisions=true`, options.token, options.serviceAccount);
  if(allSharedFlowResponse.sharedFlows){
    for (const sharedFlow of allSharedFlowResponse.sharedFlows){
      if(sharedFlow.revision && sharedFlow.revision.length>=options.revisions)
        console.log(`SharedFlow: ${sharedFlow.name} has ${sharedFlow.revision.length} revisions`)
    }
  }
}

module.exports = {
    test,
    process
};
