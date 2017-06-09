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

function searchForTrader() {

  // var options = {
  //   uri: 'https://api.github.com/user/repos',
  //   qs: {
  //     access_token: 'xxxxx xxxxx' // -> uri + '?access_token=xxxxx%20xxxxx'
  //   },
  //   headers: {
  //     'User-Agent': 'Request-Promise'
  //   },
  //   json: true // Automatically parses the JSON string in the response
  // };


}

module.exports = {
  signUpAsTrader: signUpAsTrader,
  searchForTrader: searchForTrader
};
