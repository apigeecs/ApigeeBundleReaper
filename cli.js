#!/usr/bin/env node
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
const { Command } = require('commander');
      program = new Command(),
      Option = require('commander').Option,
      pkj = require('./package.json'),
      findProxiesWithoutTraffic = require("./src/package/findProxiesWithoutTraffic"),
      findUndeployedProxies = require("./src/package/findUndeployedProxies"),
      findDeploymentCount = require("./src/package/findDeploymentCount"),
      listProxiesWithRevisions = require("./src/package/listProxiesWithRevisions");

program
    .name('bundle-reaper')
    .description('Apigee Bundle Reaper')
    .version(pkj.version);

program.command('findProxiesWithoutTraffic')
    .description('To find the list of proxies without traffic in an Apigee organization')
    .option("-o, --organization <organization>", "Please provide the Apigee Organization Name")
    .addOption(new Option("-e, --environment <environment>", "Please provide a specific Environment name").default('all'))
    .option("-t, --token <token>", "Please provide the access token")
    .option("-d, --axDays <axDays>", "Please provide the number of days for Traffic", parseInt)
    .addOption(new Option("-u, --undeployUnused <undeployUnused>", "Do you want to undeploy unsed proxies? Y or N").choices(['Y', 'N']).default('N'))
    .action((options) => {
        validate(options, 'findProxiesWithoutTraffic');
        findProxiesWithoutTraffic.process(options);
    });

program.command('findUndeployedProxies')
    .description('To find the list of undeployed proxies in an Apigee organization')
    .option("-o, --organization <organization>", "Please provide the Apigee Organization Name")
    .addOption(new Option("-e, --environment <environment>", "Please provide a specific Environment name").default('all'))
    .option("-t, --token <token>", "Please provide the access token")
    .action((options) => {
        validate(options, 'findUndeployedProxies');
        findUndeployedProxies.process(options);
    });

program.command('findDeploymentCount')
    .description('To find the number of proxies/sharedflows deployed in an Apigee environment')
    .option("-o, --organization <organization>", "Please provide the Apigee Organization Name")
    .addOption(new Option("-e, --environment <environment>", "Please provide a specific Environment name").default('all'))
    .option("-t, --token <token>", "Please provide the access token")
    .action((options) => {
        validate(options, 'findDeploymentCount');
        findDeploymentCount.process(options);
    });

program.command('listProxiesWithRevisions')
    .description('To list proxies and sharedflows that have higher revisions')
    .option("-o, --organization <organization>", "Please provide the Apigee Organization Name")
    .addOption(new Option("-e, --environment <environment>", "Please provide a specific Environment name").default('all'))
    .option("-r, --revisions <revisions>", "Number of revisions to search", parseInt)
    .option("-t, --token <token>", "Please provide the access token")
    .action((options) => {
        validate(options, 'listProxiesWithRevisions');
        listProxiesWithRevisions.process(options);
    });

program.parse(process.argv);

function validate(options, command){
    var flag = true;
    if(!options.organization){
        console.log("Please provide the Apigee Organization Name using the '-o' option");
        flag = false;
    }
    if(!options.environment){
        console.log("Please provide the Environment name using the '-e' option");
        flag = false;
    }
    if(!options.token){
        console.log("Please provide the access token using the '-t' option");
        flag = false;
    }
    if(command == 'findProxiesWithoutTraffic' && !options.axDays){
        console.log("Please provide the number of days for Traffic using the '-d' option");
        flag = false;
    }
    if(command == 'findProxiesWithoutTraffic' && !options.undeployUnused){
        console.log("Please provide if you would like to undeploy the unused proxies using the '-u' option");
        flag = false;
    }
    if(command == 'listProxiesWithRevisions' && !options.revisions){
        console.log("Please provide the number of revisions using the '-r' option");
        flag = false;
    }
    // if(command == 'findUndeployedProxies' && !options.deleteUndeployed){
    //     console.log("Please provide if you would like to delete the proxy using the '-x' option");
    //     flag = false;
    // }
    if(!flag){
        process.exit(1);
    }
}