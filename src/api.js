var rp = require('request-promise-native');
const baseUrl = 'http://ting.au.ngrok.io/'
const Logger = require('./lib/Logger');

function signUpAsTrader(tokenAddress, paymentAddress, username, currency, region, country, type, callback) {


  let body = {
    tokenAddress: tokenAddress,
    paymentAddress: paymentAddress,
    username: username,
    currency: currency,
    region: region,
    country: country,
    type: type
  };

  console.log('body: ' + JSON.stringify(body));

  var options = {
    method: 'POST',
    uri: baseUrl + 'traders',
    body: body,
    json: true // Automatically parses the JSON string in the response
  };

  rp(options)
    .then(function(parsedBody) {
      // POST succeeded...

      console.log('signUpAsTrader success:' + parsedBody);

      callback(true);

    })
    .catch(function(err) {
      // POST failed...
      console.log('signUpAsTrader failed: ' + err);

      callback(false);

    });

}

// Callback (success, trader)
// Trader is null if unavailable
function searchForTrader(myAddress, region, country, currency, type, callback) {

  let qs = {
    myAddress: myAddress,
    region: region,
    country: country,
    currency: currency,
    type: type
  };

  console.log('qs: ' + JSON.stringify(qs));

  var options = {
    uri: baseUrl + 'traders/search',
    qs: qs,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
  };

  rp(options)
    .then(function(parsedBody) {
      callback(true, parsedBody);
    })
    .catch(function(err) {
      // API call failed...
      callback(false);
    });

}

module.exports = {
  signUpAsTrader: signUpAsTrader,
  searchForTrader: searchForTrader
};
