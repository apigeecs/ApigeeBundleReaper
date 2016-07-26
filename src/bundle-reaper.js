var program = require("commander");
var colors = require("colors");
var proxyStatus = require("./package/getProxyStatus");


function makeRed(txt) {
  return colors.red(txt); //display the help text in red on the console 
}


program
  .version("0.0.1")
  .option("-h, --host <host>", "Please provide Management API Host Information [api.enterprise.apigee.com]")
  .option("-o, --organization <organization>", "Please provide the Edge Organization Name")
  .option("-e, --environment <environment>", "Please provide the Environment name [all | test]")
  .option("-a, --authorization <authorization>", "Please provide the Edge Basic auth credentials [Basic <auth>]")
  .option("-d, --axDays <axDays>", "Please provide the number of days for Traffic", parseInt)
  .option("-x, --deleteUndeployed <deleteUndeployed>", "Do you want to delete the undeployed APIs ? [yes | no]")
  .parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp(makeRed);
    process.exit(1);
 }

var flag = true;
if(typeof program.host === "undefined" || program.host === true){
	console.log(colors.red("Please provide Management API Host Information [api.enterprise.apigee.com]"));
	flag = false;
}
if(typeof program.organization === "undefined" || program.organization === true){
	console.log(colors.red("Please provide the Edge Organization Name"));
	flag = false;
}
if(typeof program.environment === "undefined" || program.environment === true){
	console.log(colors.red("Please provide the Environment name [all | test]"));
	flag = false;
}
if(typeof program.authorization === "undefined" || program.authorization === true){
	console.log(colors.red("Please provide the Edge Basic auth credentials [Basic <auth>]"));
	flag = false;
}
if(typeof program.axDays === "undefined" || program.axDays === true){
	console.log(colors.red("Please provide the number of days for Traffic"));
	flag = false;
}
if(typeof program.axDays === "undefined" || program.axDays === true){
	console.log(colors.red("Please provide the number of days for Traffic"));
	flag = false;
}
if(typeof program.deleteUndeployed === "undefined" || program.deleteUndeployed === true){
  console.log(colors.red("Please provide yes or no for deleting undeployed APIs"));
  flag = false;
}
if(!flag){
	process.exit(1);
}

proxyStatus.exportAPITrafficStatus({
    host: program.host, //api.enterprise.apigee.com
    org:  program.organization, //saisarantest
    auth: program.authorization, //"Basic <auth>",
    env:  program.environment, //all|<valid env>
    axDays: program.axDays //90
});


proxyStatus.exportAPIDeploymentStatus({
    host: program.host, //api.enterprise.apigee.com
    org:  program.organization, //saisarantest
    auth: program.authorization, //"Basic <auth>",
    env:  program.environment, //all
    deleteUndeployed: program.deleteUndeployed //no
});


