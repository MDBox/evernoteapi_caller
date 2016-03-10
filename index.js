/*
The MIT License (MIT)

Copyright (c) 2016 Michael Bawiec

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var Evernote      = require('evernote').Evernote,
    crypto        = require('crypto'),
    request       = require('request');

var produrl = 'www.evernote.com';
var devurl  = 'sandbox.evernote.com';

var config = {
    "sandbox": true,
    "baseurl": devurl
}

var sandbox = true;

/*
  Evernote API caller
*/
var EvernoteClient = function(options){
  if(options){
    config.sandbox = options.sandbox || true;
    config.consumerKey = options.consumerKey;
    config.consumerSecret = options.consumerSecret;
    config.evernotecallback = options.evernotecallback;
    if(!config.sandbox){
      config.baseurl = produrl;
    }
  }
}

EvernoteClient.prototype.getRequestToken = function(callback){
  var client = new Evernote.Client(config);
  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      client.getRequestToken(config.evernotecallback, function(error, oauthToken, oauthTokenSecret, results){
        if(error){
          reject(error);
        }
        var obj = {
          oauthToken: oauthToken,
          oauthTokenSecret: oauthTokenSecret,
          results: results,
          authurl: client.getAuthorizeUrl(oauthToken)
        }
        resolve(obj);
      });
    });
    return p;
  }else{
    client.getRequestToken(config.evernotecallback, function(error, oauthToken, oauthTokenSecret, results){
      var authurl = client.getAuthorizeUrl(oauthToken);
      callback(error, oauthToken, oauthTokenSecret, authurl, results);
    });
  }
}

EvernoteClient.prototype.getImage = function(token, guid, shardid, callback){
  if(!token || !guid || !shardid){
    callback('must pass token, guid, and shardid');
    return;
  }
  var url = 'https://'+config.baseurl+ '/shard/'+shardid+'/thm/note/'+guid;
  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      request.post({url: url, form: {auth:token}, encoding:'binary'}, function(err, response, body){
        if(err){
          reject(err);
        }else{
          var obj = {
            response: response,
            body: body
          }
          resolve(obj);
        }
      });
    });
    return p;
  }else{
    request.post({url: url, form: {auth:token}, encoding:'binary'}, callback);
  }
}

EvernoteClient.prototype.getAccessToken = function(token, secret, verifier, callback){
  if(!token || !secret || !verifier){
    callback('must pass token, secret, and verifier');
    return;
  }
  var client = new Evernote.Client(config);
  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      client.getAccessToken(token, secret, verifier,
        function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
          if(error){
            reject(error);
          }else{
            var obj = {
              oauthAccessToken: oauthAccessToken,
              oauthAccessTokenSecret: oauthAccessTokenSecret,
              results: results
            }
            resolve(obj);
          }
        });
    });
    return p;
  }else{
    client.getAccessToken(token, secret, verifier,
      function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
        callback(error, oauthAccessToken, oauthAccessTokenSecret, results);
      });
  }
}

EvernoteClient.prototype.getUser = function(token, callback){
  if(!token){
    callback('must pass token');
    return;
  }

  var userclient = new Evernote.Client({token: token, sandbox: sandbox});
  var userStore = userclient.getUserStore();
  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      userStore.getUser(token, function(err, results) {
        if(err){reject(err);}else{
          resolve(results);
        }
      });
    });
    return p;
  }else{
    userStore.getUser(token, function(err, results) {
      callback(err, results);
    });
  }
}

EvernoteClient.prototype.autehnticateToSharedNotebook = function(token, notebook, callback){
  if(!token || !notebook){
    callback('must pass token and notebook');
    return;
  }

  var userclient = new Evernote.Client({token: token, sandbox: sandbox});
  notebook.noteStoreUrl = 'https://' + userclient.serviceHost + '/shard/' + notebook.shardId + '/notestore';
  notebook.webApiUrlPrefix = 'https://' + userclient.serviceHost + '/shard/' + notebook.shardId + '/';
  var userstore = userclient.getSharedNoteStore(notebook);

  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      userstore.authenticateToSharedNotebook(notebook.shareKey, token, function(err, results) {
        if(err){
          reject(err);
        }else{
          resolve(results);
        }
      });
    });
    return p;
  }else{
    userstore.authenticateToSharedNotebook(notebook.shareKey, token, callback);
  }
}

EvernoteClient.prototype.getSharedNotebookByAuth = function(token, shareToken, notebook, callback){
  if(!shareToken || !notebook){
    callback('must pass notebook and shareToken: authenticateToSharedNotebook first');
    return;
  }
  var userclient = new Evernote.Client({token: token, sandbox: sandbox});
  notebook.noteStoreUrl = 'https://' + userclient.serviceHost + '/shard/' + notebook.shardId + '/notestore';
  notebook.webApiUrlPrefix = 'https://' + userclient.serviceHost + '/shard/' + notebook.shardId + '/';

  var notestore = userclient.getSharedNoteStore(notebook);
  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      notestore.getSharedNotebookByAuth(shareToken, function(err, results) {
        if(err){
          reject(err);
        }else{
          resolve(results);
        }
      });
    });
    return p;
  }else{
    notestore.getSharedNotebookByAuth(shareToken, function(err, results){
      callback(err, results);
    });
  }
}

/*
  List user's notebooks only
*/
EvernoteClient.prototype.listNotebooks = function(token, callback){
  if(!token){
    callback('must pass token');
    return;
  }
  var userclient = new Evernote.Client({token: token, sandbox: sandbox});
  var notestore = userclient.getNoteStore();
  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      notestore.listNotebooks(function(err, results) {
        if(err){
          reject(err);
        }else{
          resolve(results);
        }
      });
    });
    return p;
  }else{
    notestore.listNotebooks(function(err, results){
      callback(err, results);
    });
  }
}

/*
  Request notebooks that are shared with the user
*/
EvernoteClient.prototype.listLinkedNotebooks = function(token, callback){
  if(!token){
    callback('must pass token');
    return;
  }
  var userclient = new Evernote.Client({token: token, sandbox: sandbox});
  var notestore = userclient.getNoteStore();
  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      notestore.listLinkedNotebooks(userclient.token, function(err, results) {
        if(err){
          reject(err);
        }else{
          resolve(results);
        }
      });
    });
    return p;
  }else{
    notestore.listLinkedNotebooks(userclient.token, function(err, results){
      callback(err, results);
    })
  }
}

/*
  Request information about notebooks the user is sharing
*/
EvernoteClient.prototype.listSharedNotebooks = function(token, callback){
  var userclient = new Evernote.Client({token: token, sandbox: sandbox});
  var notestore = userclient.getNoteStore();
  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      notestore.listSharedNotebooks(userclient.token, function(err, results) {
        if(err){
          reject(err);
        }else{
          resolve(results);
        }
      });
    });
    return p;
  }else{
    notestore.listSharedNotebooks(userclient.token, function(err, results){
      callback(err, results);
    })
  }
}

/*
  Share a user's notebook with another user
  AccessLevel is default FULL_ACCESS

  Access Level keys
  'READ_NOTEBOOK'
  'MODIFY_NOTEBOOK_PLUS_ACTIVITY'
  'READ_NOTEBOOK_PLUS_ACTIVITY'
  'GROUP'
  'FULL_ACCESS'
  'BUSINESS_FULL_ACCESS'
*/
EvernoteClient.prototype.createSharedNotebook = function(token, guid, email, accesslevel, callback){
  if(!token || !guid || !email){
    callback('must pass token, guid, and email');
    return;
  }

  var notebook = new Evernote.SharedNotebook();
  notebook.notebookGuid = guid;
  notebook.email = email;

  notebook.privilege = Evernote.SharedNotebookPrivilegeLevel[accesslevel] ||
                       Evernote.SharedNotebookPrivilegeLevel.FULL_ACCESS;

  var userclient = new Evernote.Client({token: token, sandbox: sandbox});
  var notestore = userclient.getNoteStore();

  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      notestore.createSharedNotebook(userclient.token, notebook, function(err, results) {
        if(err){
          reject(err);
        }else{
          resolve(results);
        }
      });
    });
    return p;
  }else{
    notestore.createSharedNotebook(userclient.token, notebook, function(err, results){
      callback(err, results);
    });
  }
}


/*
  Request a list of notes for a notebook
  options.offset - offset to start search
  options.keywords - words to filter search
  options.ascending - show results in ascending order (true/false);
  options.maxsize - max number of notes to return
*/
EvernoteClient.prototype.findNotesMetadata = function(token, guid, options, callback){
  if(!token){
    callback('must pass token');
    return;
  }

  var maxsize = 50;
  var offset = 0;
  var notefilter = new Evernote.NoteFilter();
  notefilter.notebookGuid = guid || null;
  if(options){
    if(options.keywords){
      notefilter.words = options.keywords;
    }
    if(options.ascending){
      notefilter.ascending = options.ascending;
    }
    if(options.maxsize){
      maxsize = options.maxsize;
    }
    if(options.offset){
      offset = options.offset;
    }
  }

  var notemetaresult = new Evernote.NotesMetadataResultSpec();
  notemetaresult.includeTitle = true;
  notemetaresult.includeCreated = true;
  notemetaresult.includeUpdated = true;
  notemetaresult.includeNotebookGuid = true;
  notemetaresult.includeLargestResourceMime = true;
  notemetaresult.includeLargestResourceSize = true;

  var userclient = new Evernote.Client({token: token, sandbox: sandbox});
  var notestore = userclient.getNoteStore();
  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
    notestore.findNotesMetadata(userclient.token, notefilter, offset, maxsize, notemetaresult, function(err, results){
        if(err){
          reject(err);
        }else{
          resolve(results);
        }
      });
    });
    return p;
  }else{
    notestore.findNotesMetadata(userclient.token, notefilter, offset, maxsize, notemetaresult, function(err, results){
      callback(err, results);
    });
  }
}

/*
  Create a new notebook
*/
EvernoteClient.prototype.createNotebook = function(token, name, callback){
  if(!token || !name){
    callback('must pass token and name');
    return;
  }
  var notebook = new Evernote.Notebook();
  notebook.name = name;
  var userclient = new Evernote.Client({token: token, sandbox: sandbox});
  var notestore = userclient.getNoteStore();

  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      notestore.createNotebook(userclient.token, notebook, function(err, results) {
        if(err){
          reject(err);
        }else{
          resolve(results);
        }
      });
    });
    return p;
  }else{
    notestore.createNotebook(userclient.token, notebook, function(err, results){
      callback(err, results);
    });
  }
}

/*
  Update a notebook
  guid - notebook guid
  name - the update notebook name
*/
EvernoteClient.prototype.updateNotebook = function(token, guid, name, callback){
  if(!token || !name){
    callback('must pass token and name');
    return;
  }
  var notebook = new Evernote.Notebook();
  notebook.guid = guid;
  notebook.name = name;
  var userclient = new Evernote.Client({token: token, sandbox: sandbox});
  var notestore = userclient.getNoteStore();

  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      notestore.updateNotebook(userclient.token, notebook, function(err, results) {
        if(err){
          reject(err);
        }else{
          resolve(results);
        }
      });
    });
    return p;
  }else{
    notestore.updateNotebook(userclient.token, notebook, function(err, results){
      callback(err, results);
    });
  }
}

/*
  Update existing note
*/
EvernoteClient.prototype.updateNote = function(token, guid, title, callback){
  if(!token || !guid || !title){
    callback('must pass token, guid, and title');
    return;
  }

  var note = new Evernote.Note();
  note.guid = guid;
  note.title = title;

  var userclient = new Evernote.Client({token: token, sandbox: sandbox});
  var notestore = userclient.getNoteStore();

  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      notestore.updateNote(userclient.token, note, function(err, results) {
        if(err){
          reject(err);
        }else{
          resolve(results);
        }
      });
    });
    return p;
  }else{
    notestore.updateNote(userclient.token, note, function(err, results){
      callback(err, results);
    });
  }
}

/*
  Create a new note
  image - should needs to be base64 encoded
*/
EvernoteClient.prototype.createNote = function(token, guid, title, content, image, callback){
  if(!token || !guid || !title){
    callback('must pass token, guid, and title');
    return;
  }

  var note = new Evernote.Note();
  note.title = title;
  note.notebookGuid = guid;
  note.content = '<?xml version="1.0" encoding="UTF-8"?>'
              + '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">'
              + '<en-note>';

  if(content){
    node.content += content;
  }

  if(image){
    var matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

    var body = new Buffer(matches[2], 'base64');
    var bodyHash = crypto.createHash('md5').update(new Buffer(matches[2], 'base64')).digest('hex');

    var data = new Evernote.Data({
      body: body
    });
    var resource = new Evernote.Resource({
      data: data,
      mime: matches[1]
    });

    note.resources = [resource];
    note.content += '<en-media type="' + note.resources[0].mime + '" hash="' + bodyHash + '" />'
  }

  note.content += '</en-note>';
  console.log(note.content);

  var userclient = new Evernote.Client({token: token, sandbox: sandbox});
  var notestore = userclient.getNoteStore();

  if(callback === undefined){
    var p = new Promise(function(resolve, reject){
      notestore.createNote(userclient.token, note, function(err, results) {
        if(err){
          reject(err);
        }else{
          resolve(results);
        }
      });
    });
    return p;
  }else{
    notestore.createNote(userclient.token, note, function(err, results){
      callback(err, results);
    });
  }
}


exports.EvernoteApiClient = EvernoteClient;
