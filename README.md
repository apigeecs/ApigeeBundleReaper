ApigeeBundleReaper
===================

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/3ce632f7aa6b417983c464fc3cb99c71)](https://www.codacy.com/app/ssvaidyanathan/ApigeeBundleReaper?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=apigeecs/ApigeeBundleReaper&amp;utm_campaign=Badge_Grade)

Tool to faciliate Apigee Edge Organization maintenance

A  library providing utility to determine the proxies that are not deployed or being used (No Traffic)

A future version will include downloading the proxy bundle to a local directory, delete the bundle from Apigee Edge

Features include:
* Listing API proxies that are not deployed (for a given environment or all environments)
* Listing API proxies that has no traffic for a specified number of days (for a given environment or all environments)

## Installation

The only prerequisites not handled during the installation are a functional Node environment, the availability of npm, and sufficient priviledges to run commands as adminstrator. The steps below are applicable to a Mac OS X environment, similar steps work under Linux or Windows. 
	
Clone the bundle-reaper repository to your local machine:

	ApigeeCorporation$ git clone https://github.com/ssvaidyanathan/bundle-reaper.git

Alternatively you can download the zip file via the GitHub home page and unzip the archive.

Navigate to the package directory:

	ApigeeCorporation$ cd path/to/bundle-reaper/src/package/

Install npm modules:

	ApigeeCorporation$ sudo npm install

## Usage
	
	ApigeeCorporation$ node reaper_env.js
	prompt: Please provide Org Name:  saisarantest
	prompt: Please provide Env Name:  (test) test
	prompt: Please provide number of days:  (90) 90
	prompt: Please provide Org User ID:  ssvaidyanathan@apigee.com
	prompt: Please provide Org User Password:
	
	Output:
	-------------------------Undeployed APIs in test-----------------------------
	oauth10a-3legged
	emailer
	authorize
	json-validate
	catchAll
	token_v3_rev3_2016_03_01
	-----------------------------------------------------------------------------
	
	--------------APIs with No Traffic in test in the last 90 days---------------
	java-cookbook
	base64encoder
	jira-release-notes
	ratingsService
	oauth10a-3legged
	response-cache
	oauth-login-app
	oauth-client-credentials
	-----------------------------------------------------------------------------

Similarly for reaper_all.js
	
	ApigeeCorporation$ node reaper_all.js
	prompt: Please provide Org Name:  saisarantest
	prompt: Please provide number of days:  (90) 90
	prompt: Please provide Org User ID:  ssvaidyanathan@apigee.com
	prompt: Please provide Org User Password:
	
	Output:
	-------------------------Undeployed APIs in test-----------------------------
	oauth10a-3legged
	emailer
	authorize
	json-validate
	catchAll
	token_v3_rev3_2016_03_01
	-----------------------------------------------------------------------------
	
	--------------APIs with No Traffic in test in the last 90 days---------------
	java-cookbook
	base64encoder
	jira-release-notes
	ratingsService
	oauth10a-3legged
	response-cache
	oauth-login-app
	oauth-client-credentials
	-----------------------------------------------------------------------------

	-------------------------Undeployed APIs in prod-----------------------------
	json-validate
	catchAll
	token_v3_rev3_2016_03_01
	-----------------------------------------------------------------------------
	
	--------------APIs with No Traffic in prod in the last 90 days---------------
	java-cookbook
	base64encoder
	response-cache
	oauth-login-app
	oauth-client-credentials
	-----------------------------------------------------------------------------
