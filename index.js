var token = '';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Hello world');
});

app.listen(5000, function () {
  console.log('Listening on port 5000');
});

// respond to facebook's verification
app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'token') {
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Error, wrong validation token');
  }
});


//functions----------------------------------------------------------------------------------------------------


//given a user message that includes 'gif', output the formatted giphy api call
function getGiphyImageURL(text, callback) {
  var userMessage = text.substr(7);
  userMessage = userMessage.replace(' ', '+');
  
  request('http://api.giphy.com/v1/gifs/search?q='+userMessage+ '&api_key=dc6zaTOxFJmzC', 
    function(error, response, body){
      if (error) {
        console.log('Error sending message: ', error);
      } else if (response.body.error) {
        console.log('Error: ', response.body.error);
      } else{
        var parsed = JSON.parse(body);
        var randomIndex = Math.floor((Math.random() * 25) + 1);
        var giphyURL = parsed.data[randomIndex].images.original.url;
        console.log('user searched for ' + userMessage);
        console.log(giphyURL);
        callback(giphyURL);
      }
    }

    );

}

//send image message
function sendImageMessage(sender, userText) {
  getGiphyImageURL(userText, function(passedInGiphyURL){
    console.log('about to format the image request');
    console.log('sending image request for the URL' + passedInGiphyURL);
    messageData = {
      "attachment": {
        "type": "image",
        "payload": {
          "url": passedInGiphyURL
        }
      }
    };

    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token:token},
      method: 'POST',
      json: {
        recipient: {id:sender},
        message: messageData,
      }
    }, function(error, response, body) {
      if (error) {
        console.log('Error sending message: ', error);
      } else if (response.body.error) {
        console.log('Error: ', response.body.error);
      }
    });
  });
}

//send basic text message, found from Facebook quickstart guide
function sendTextMessage(sender, text) {
  messageData = {
    text:text
  }

  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}

//send generic message, found from Facebook quickstart guide
function sendGenericMessage(sender) {
  messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Poop",
          "subtitle": "It's poop man",
          "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
          "buttons": [{
            "type": "web_url",
            "url": "https://www.messenger.com/",
            "title": "Web url"
          }, {
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for first element in a generic bubble",
          }],
        },{
          "title": "Second card",
          "subtitle": "Element #2 of an hscroll",
          "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
          "buttons": [{
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for second element in a generic bubble",
          }],
        }]
      }
    }
  };
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}


//sends actual message=====================

//listen for post request and send back the users own message
app.post('/webhook/', function (req, res) {
  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    if (event.message && event.message.text) {
      text = event.message.text;
      if (text.substring(0,7) == '.giphy ') {
        sendImageMessage(sender, text);
        continue;
      }
      console.log('user typed: ' + text);
      sendTextMessage(sender, text.substring(0, 200));
    }
    if (event.postback) {
      text = JSON.stringify(event.postback);
      sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token);
      continue;
    }
  }
  res.sendStatus(200);
});