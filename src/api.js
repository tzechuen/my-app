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

function submitNewTrade(myTokenAddress, myPaymentAddress, myUsername, traderTokenAddress, traderPaymentAddress, traderUsername, ethAmount, currency, region, country, details, type, callback) {

  let body = {
    'tradeeTokenAddress': myTokenAddress,
    'tradeePaymentAddress': myPaymentAddress,
    'tradeeUsername': myUsername,
    'traderTokenAddress': traderTokenAddress,
    'traderPaymentAddress': traderPaymentAddress,
    'traderUsername': traderUsername,
    'ethAmount': ethAmount,
    'currency': currency,
    'region': region,
    'country': country,
    'details': details,
    'type': type
  };

  console.log('body: ' + JSON.stringify(body));

  var options = {
    method: 'POST',
    uri: baseUrl + 'trades',
    body: body,
    json: true // Automatically parses the JSON string in the response
  };

  rp(options)
    .then(function(parsedBody) {
      // POST succeeded...

      console.log('new trade success:' + parsedBody);

      callback(true);

    })
    .catch(function(err) {
      // POST failed...
      console.log('new trade failed: ' + err);

      callback(false);

    });

}

function findTrade(traderTokenAddress, callback) {

  let qs = {
    traderTokenAddress: traderTokenAddress
  };

  var options = {
    uri: baseUrl + 'trades/search',
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

// REMINDER!!!! To add the new functions into this #JSnoob
module.exports = {
  signUpAsTrader: signUpAsTrader,
  searchForTrader: searchForTrader,
  submitNewTrade: submitNewTrade,
  findTrade: findTrade
};
