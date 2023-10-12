ApigeeBundleReaper
===================

Tool to faciliate Apigee Organization maintenance

A  library providing utility to determine the proxies that are not deployed or being used (No Traffic)

Features include:
* Listing API proxies that has no traffic for a specified number of days (for a given environment or all environments)
* Undeploys the list of proxies that has no traffic
* Listing API proxies that are not deployed to a given environment


## Pre-requisites
- Node.js
- gcloud SDK
	

## Installation

Clone the bundle-reaper repository to your local machine:
```sh
git clone https://github.com/apigeecs/ApigeeBundleReaper.git
cd ApigeeBundleReaper
```

Execute the following command:
```sh
sudo npm install -g
```

This will install the tool as a binary

## Usage
```sh
bundle-reaper --help
bundle-reaper findProxiesWithoutTraffic --help
bundle-reaper findUndeployedProxies --help
bundle-reaper findDeploymentCount --help
bundle-reaper listProxiesWithRevisions --help
```	

### findProxiesWithoutTraffic
To find the proxies without traffic in a given Apigee org for a given number of days. The same command can be used to undeploy those proxy revisions in the Apigee environment

```sh
TOKEN=$(gcloud auth print-access-token)
bundle-reaper findProxiesWithoutTraffic -o {org} -t $TOKEN -d {axDays}
bundle-reaper findProxiesWithoutTraffic -o {org} -t $TOKEN -d {axDays} -u Y #to undeploy the proxies without no traffic
```

### findUndeployedProxies
To find the proxies that are not deployed to an Apige environment

```sh
TOKEN=$(gcloud auth print-access-token)
bundle-reaper findUndeployedProxies -o {org} -t $TOKEN 
```

### findDeploymentCount
To find the number of proxies/sharedflows deployed in an Apigee environment

```sh
TOKEN=$(gcloud auth print-access-token)
bundle-reaper findDeploymentCount -o {org} -t $TOKEN 
```

### listProxiesWithRevisions
To list proxies and sharedflows that have higher revisions

```sh
TOKEN=$(gcloud auth print-access-token)
bundle-reaper listProxiesWithRevisions -o {org} -t $TOKEN -r {rev}
```

**NOTE:** You can either pass the token using the `-t` option or the path of the service account json file using the `-s` option. Latter will be used to generate the token and invoke the Apigee APIs.