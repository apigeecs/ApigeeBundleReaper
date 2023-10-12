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

const axios = require('axios');
const {GoogleAuth} = require('google-auth-library');
const debug = require("debug")(`utils`);

//Call Mgmt API
async function callMgmtAPI(method, path, token, serviceAccount) {
  if(!token){
    token = await getGoogleAccessToken(serviceAccount);
  }
  const instance = axios.create({
    method,
    baseURL: "https://apigee.googleapis.com",
    headers: {"Authorization": `Bearer ${token}`},
    validateStatus: function (status) {
      return status >= 200 && status < 300; // default
    }
  });
  try {
    const response = await instance(path);
    return response.data;
  } catch (error) {
    //console.error(error.response.data);
    throw error;
  }
}

async function getGoogleAccessToken(serviceAccount){
  process.env.GOOGLE_APPLICATION_CREDENTIALS=serviceAccount;
  const auth = new GoogleAuth({scopes: 'https://www.googleapis.com/auth/cloud-platform'}); 
  const token = await auth.getAccessToken();
  return token;
}

module.exports = {
  callMgmtAPI
};