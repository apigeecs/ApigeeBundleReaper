var program = require("commander");
var colors = require("colors");
var proxyStatus = require("./package/getProxyStatus");

function make_red(txt) {
  return colors.red(txt); //display the help text in red on the console 
}

program
  .version("0.0.1")
  .option("-h, --host [host]", "Please provide Management API Host Information [api.enterprise.apigee.com]")
  .option("-o, --organization [organization]", "Please provide the Edge Organization Name")
  .option("-e, --environment [environment]", "Please provide the Environment name [all | test]")
  .option("-a, --authorization [authorization]", "Please provide the Edge Basic auth credentials [Basic <auth>]")
  .option("-d, --axDays [axDays]", "Please provide the number of days for Traffic", parseInt)
  .parse(process.argv);

var flag = true;

if(program.host === undefined || program.host === true){
	console.log(colors.red("Please provide Management API Host Information [api.enterprise.apigee.com]"));
	flag = false;
}
if(program.organization === undefined || program.organization === true){
	console.log(colors.red("Please provide the Edge Organization Name"));
	flag = false;
}
if(program.environment === undefined || program.environment === true){
	console.log(colors.red("Please provide the Environment name [all | test]"));
	flag = false;
}
if(program.authorization === undefined || program.authorization === true){
	console.log(colors.red("Please provide the Edge Basic auth credentials [Basic <auth>]"));
	flag = false;
}
if(program.axDays === undefined || program.axDays === true){
	console.log(colors.red("Please provide the number of days for Traffic"));
	flag = false;
}
if(!flag){
	return;
}

proxyStatus.exportAPITrafficStatus({
    host: program.host, //api.enterprise.apigee.com
    org:  program.organization, //saisarantest
    auth: program.authorization, //"Basic c3N2YWlkeWFuYXRoYW5AYXBpZ2VlLmNvbTpUZWphczE4MDEyMDEy",
    env:  program.environment, //all|<valid env>
    axDays: program.axDays //90
});


proxyStatus.exportAPIDeploymentStatus({
    host: program.host, //api.enterprise.apigee.com
    org:  program.organization, //saisarantest
    auth: program.authorization, //"Basic c3N2YWlkeWFuYXRoYW5AYXBpZ2VlLmNvbTpUZWphczE4MDEyMDEy",
    env:  program.environment, //all
});