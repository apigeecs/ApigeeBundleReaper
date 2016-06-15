var proxyStatus = require("./package/getProxyStatus");

proxyStatus.exportAPITrafficStatus({
    host: "api.enterprise.apigee.com",
    org: "<org>",
    auth: "Basic <auth>",
    env: "all", //all|<valid env>
    axDays: 90
});


proxyStatus.exportAPIDeploymentStatus({
    host: "api.enterprise.apigee.com",
    org: "<org>",
    auth: "Basic <auth>",
    env: "all" //all|<valid env>
});
