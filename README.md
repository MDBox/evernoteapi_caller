# evernoteapi_caller
A wrapper for Evernote API   

## Install  
```javascript
npm install --save evernote-utils 
```

## Usage  
```javascript
var Evernote = require('evernote-utils').EvernoteApiClient;
var client = new Evernote({
    sandbox = true;
    consumerKey = 'xxx',
    consumerSecret = 'xxx',
    evernotecallback = 'http://127.0.0.1/callback'
});

//Get Auth URL
client.getRequestToken().then(function(results){
  //Save results.oauthTokenSecret for later ---
  console.log(results.authurl);//Redirect user to this url
}).catch(function(err){
  console.log(err);
});

//Get Auth Token
client.getAccessToken(token, oauthTokenSecret, verifyer).then(function(results){
  console.log(results.oauthAccessToken);
}).catch(function(err){
  console.log(err);
});

//List Notebooks
client.listNotebooks(oauthAccessToken).then(function(results){
  console.log(results);
}).catch(function(err){
  console.log(err);
});

//List LinkedNotebooks
client.listLinkedNotebooks(oauthAccessToken).then(function(results){
  console.log(results);
  return client.autehnticateToSharedNotebook(oauthAccessToken, results[0]);
}).then(function(results){
  console.log(results);
  return client.getSharedNotebookByAuth(oauthAccessToken, results.authenticationToken, notebook);
}).then(function(results){
  console.log(results);
}).catch(function(err){
  console.log(err);
});

```
