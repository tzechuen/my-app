const Bot = require('./lib/Bot')
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')
const Api = require('./api');

let bot = new Bot()

// ROUTING

bot.onEvent = function(session, message) {
  switch (message.type) {
    case 'Init':
      welcome(session)
      break
    case 'Message':
      onMessage(session, message)
      break
    case 'Command':
      onCommand(session, message)
      break
    case 'Payment':
      onPayment(session, message)
      break
    case 'PaymentRequest':
      welcome(session)
      break
  }
}

//
// bot.hear('reset', (session, message) => {
//   session.reset()
//   session.reply(SOFA.Message({
//     body: "I've reset your state."
//   }));
// })
//

function welcome(session) {

  let controls = [{
      type: 'button',
      label: 'I want to buy ETH using cash',
      value: 'buyETH'
    },
    {
      type: 'button',
      label: 'I want to sell ETH for cash',
      value: 'sellETH'
    }
  ]

  session.reply(SOFA.Message({
    body: 'Hello there! Welcome to Eth2Cash. How can I help you today?',
    controls: controls,
    showKeyboard: false
  }))
}


function onMessage(session, message) {

  if (message.content.body.toLowerCase() == 'reset') {
    session.reset();
    welcome(session);
    return;
  }

  let address = session.address;
  let user = session.user;


  console.log('onMessage from ' + address);
  console.log('user: ' + JSON.stringify(user));

  let body = message.content.body.toLowerCase();

  console.log('Body: ' + body);

  let step = session.get('step');

  console.log('Step: ' + step);
  console.log('Data: ' + JSON.stringify(session.data));

  if (step) {
    switch (step) {

      case 'trading_or_signup':
        askUserIfTradingOrSigningUp(session.get('type'), session); // Re-asks if user provided an invalid input
        break

      case 'howmuch':
        processHowMuch(session, message);
        break

      case 'currency':
        processCurrency(session, message);
        break

      case 'location':
        processLocation(session, message);
        break

      case 'details':
        processDetails(session, message);
        break

      case 'currency_for_listing':
        processCurrencyForListing(session, message);
        break

      case 'location_for_listing':
        processListingLocation(session, message);
        break

    }

  } else if (body.includes('hi') || body.includes('hello')) {
    welcome(session);
  }

}


function onCommand(session, command) {

  switch (command.content.value) {

    case 'buyETH':
      askUserIfTradingOrSigningUp('buy', session);
      break

    case 'sellETH':
      askUserIfTradingOrSigningUp('sell', session);
      break

    case 'confirmDetails':
      console.log('Confirmed Details');

      searchForTraderWithApi(session);

      break

    case 'confirmListingDetails':
      console.log('Confirmed Listing Details');

      signUpAsTraderWithApi(session);

      break

    case 'startOver':
      console.log('Start Over');

      session.reset();
      welcome(session);

      break

    case 'trade_now':
      askHowMuch(session);
      break

    case 'list_as_trader':
      askCurrencyForListing(session);
      break

    case 'sign_up_as_trader_try_again':
      signUpAsTraderWithApi(session);
      break

    case 'sign_up_as_trader_abort':
      session.reset();
      welcome(session);
      break

    case 'search_for_trader_try_again':
      searchForTraderWithApi(session);

      break

    case 'incoming_accept_trade':

      acceptedIncomingTrade(session);

      break

    case 'incoming_reject_trade':

      rejectedIncomingTrade(session);

      break

    case 'send_eth':
      sendEth(session);
      break
    case 'abort_trade':

      // TODO: Update trade in backend
      session.reset();
      welcome(session);
      break

  }

}

function sendEth(session) {

  // Request eth for the trader first
  let ethAmount = session.get('ethAmount');
  let addressToPay = session.get('addressToPay');

  session.requestEthForAddress(addressToPay, ethAmount, 'Please send me the ETH for this trade so I can send it to your trader!');

}

function onPayment(session, message) {

  console.log('onPayment');

}

function acceptedIncomingTrade(session) {
  console.log('Accepted incoming trade');

  let user = session.user;
  console.log('User: ' + JSON.stringify(user));

  Api.findTrade(user.token_id, (success, trade) => {

    if (success) {
      console.log('Found trade: ' + JSON.stringify(trade));


      if (trade.type == 'sell') { // Sell ETH

        session.setWithDictionary({
          addressToPay: trade.tradeePaymentAddress,
          ethAmount: trade.ethAmount
        })

        let controls = [{
          type: 'button',
          label: 'Confirm received cash and Send ETH',
          value: 'send_eth'
        }, {
          type: 'button',
          label: 'Abort trade',
          value: 'abort_trade'
        }]

        session.reply(SOFA.Message({
          body: `Brilliant! Once you have received your cash, please confirm so you can send them the ETHs`,
          controls: controls,
          showKeyboard: false
        }))


      } else { // Buy ETH

        let tradeeUsername = trade.tradeeUsername;
        let tradeeAddress = trade.tradeeTokenAddress;

        let controls = [{
          type: 'button',
          label: 'Abort trade',
          value: 'abort_trade'
        }]

        session.reply(SOFA.Message({
          body: `Bravo! Once you have sent cash to ${tradeeUsername}, you will receive your ETHs!`,
          controls: controls,
          showKeyboard: false
        }))

        // Make tradee send ETH
        let tradeeControls = [{
            type: 'button',
            label: 'Send ETH',
            value: 'send_eth'
          },
          {
            type: 'button',
            label: 'Abort trade',
            value: 'abort_trade'
          }
        ]

        bot.client.send(tradeeAddress, SOFA.Message({
          body: `Yay! The trader has accepted to trade with you! Please send your ETHs once you are ready.`,
          controls: tradeeControls,
          showKeyboard: false
        }));


      }





    } else {
      console.log('error finding trade');
    }

  });
}

function rejectedIncomingTrade(session) {
  console.log('Rejected incoming trade');

  let user = session.user;
  console.log('User: ' + JSON.stringify(user));
}

function searchForTraderWithApi(session) {
  console.log('searchForTraderWithApi');

  session.reply(SOFA.Message({
    body: `Hang tight! We're helping you find a trader...`,
  }))

  let user = session.user;

  let myAddress = user.token_id;
  let currency = session.get('currency');
  let region = session.get('region');
  let country = session.get('country');

  // Type should be the opposite
  let myType = session.get('type');
  let type = '';

  console.log('myType: ' + myType);

  if (myType == 'buy') {
    type = 'sell';
  } else {
    type = 'buy';
  }

  Api.searchForTrader(myAddress, region, country, currency, type, (success, trader) => {
    if (success) {
      if (trader) {
        console.log('Found trader: ' + JSON.stringify(trader));

        session.reply(SOFA.Message({
          body: `We have found a potential trader! Please wait while we contact them...`,
        }))

        // Add new trade to backend to save both trader and tradee info
        let myTokenAddress = user.token_id;
        let myPaymentAddress = user.payment_address;
        let myUsername = user.username;

        let traderTokenAddress = trader.tokenAddress;
        let traderPaymentAddress = trader.paymentAddress;
        let traderUsername = trader.username;

        let ethAmount = session.get('howmuch');
        let details = session.get('details');


        console.log('myTokenAddress: ' + myTokenAddress);
        console.log('myPaymentAddress: ' + myPaymentAddress);
        console.log('myUsername: ' + myUsername);
        console.log('traderTokenAddress: ' + traderTokenAddress);
        console.log('traderPaymentAddress: ' + traderPaymentAddress);
        console.log('traderUsername: ' + traderUsername);
        console.log('ethAmount: ' + ethAmount);
        console.log('currency: ' + currency);
        console.log('region: ' + region);
        console.log('country: ' + country);
        console.log('details: ' + details);
        console.log('type: ' + type);

        console.log('Before submitNewTrade');


        Api.submitNewTrade(myTokenAddress, myPaymentAddress, myUsername, traderTokenAddress, traderPaymentAddress, traderUsername, ethAmount, currency, region, country, details, type, function(success) {

          if (success) {
            console.log('Submit new trade success');

            if (type == 'buy') { // I am selling ETH, store address and amount
              session.setWithDictionary({
                addressToPay: traderPaymentAddress,
                ethAmount: ethAmount
              })
            }

            // Send message to potential trader
            let controls = [{
                type: 'button',
                label: 'Accept',
                value: 'incoming_accept_trade'
              },
              {
                type: 'button',
                label: 'Reject',
                value: 'incoming_reject_trade'
              }
            ]

            let traderAddress = trader.tokenAddress;

            console.log('TraderAddress: ' + traderAddress);
            console.log('Bot Client: ' + bot.client);
            bot.client.send(traderAddress, SOFA.Message({
              body: 'Placeholder message',
              controls: controls,
              showKeyboard: false
            }));

          } else {

            console.log('Submit new trade error');

          }
        });

      } else {

        let controls = [{
            type: 'button',
            label: 'Try Again',
            value: 'search_for_trader_try_again'
          },
          {
            type: 'button',
            label: 'Abort',
            value: 'search_for_trader_abort'
          }
        ]

        session.reply(SOFA.Message({
          body: `There doesn't seem to be a trader available in ${region}, ${country}. :(\n\nPlease try again later!`,
          controls: controls,
          showKeyboard: false
        }))

      }
    } else {

      console.log('Error searching for trader');

    }
  });

}


function signUpAsTraderWithApi(session) {

  let user = session.user;

  console.log('signUpAsTraderWithApi user: ' + JSON.stringify(user));

  let tokenAddress = user.token_id;
  let paymentAddress = user.payment_address;
  let username = user.username;

  console.log('tokenAddress: ' + tokenAddress);
  console.log('paymentAddress: ' + paymentAddress);

  // currency, region, country, type
  let currency = session.get('currency');
  let region = session.get('region');
  let country = session.get('country');
  let type = session.get('type');

  console.log('currency: ' + currency);
  console.log('region: ' + region);
  console.log('country: ' + country);
  console.log('type: ' + type);

  console.log('Before sign up as trader api call');

  Api.signUpAsTrader(tokenAddress, paymentAddress, username, currency, region, country, type, function(success) {

    if (success) {
      session.set('step', null);

      var message = '';

      if (type == 'buy') {
        message = "Awesome, we've signed you up as a trader.\n\nWe will notify you once we've found someone who can sell you ETH! :)";
      } else {
        message = "Awesome, we've signed you up as a trader. \n\nWe will notify you once we've found someone who wants to buy ETH! :)"
      }

      session.reply(SOFA.Message({
        body: message
      }))
    } else {

      let controls = [{
          type: 'button',
          label: 'Try Again',
          value: 'sign_up_as_trader_try_again'
        },
        {
          type: 'button',
          label: 'Abort',
          value: 'sign_up_as_trader_abort'
        }
      ]

      session.reply(SOFA.Message({
        body: 'Bugger! There appears to be an issue with our servers at the moment. :(',
        controls: controls,
        showKeyboard: false
      }))

    }

  });

}

function askUserIfTradingOrSigningUp(type, session) {

  console.log('askUserIfTradingOrSigningUp type: ' + type);

  session.setWithDictionary({
    'type': type,
    'step': 'trading_or_signup'
  });

  let controls = [{
      type: 'button',
      label: 'I want to perform a trade now',
      value: 'trade_now'
    },
    {
      type: 'button',
      label: 'I want to list myself as a trader',
      value: 'list_as_trader'
    }
  ]

  session.reply(SOFA.Message({
    body: 'Sure thing! What do you want to do?',
    controls: controls,
    showKeyboard: false
  }))

}


function askHowMuch(session) {

  session.set('step', 'howmuch');

  session.reply(SOFA.Message({
    body: "How much ETH are you looking to trade?"
  }));

}


function processHowMuch(session, message) {

  let inputHowMuch = parseFloat(message.content.body);

  console.log('inputHowMuch: ' + inputHowMuch);

  if (inputHowMuch > 0) {
    // session.set('howmuch', inputHowMuch);
    // session.set('step', 'currency');

    session.setWithDictionary({
      'howmuch': inputHowMuch,
      'step': 'currency'
    })

    session.reply(SOFA.Message({
      body: "What is your currency? (i.e. USD, AUD, SGD)"
    }))

  } else {
    session.reply(SOFA.Message({
      body: "Please specify a valid ETH value (i.e. 1.5)"
    }))
  }
}



function askCurrencyForListing(session) {

  session.set('step', 'currency_for_listing');

  session.reply(SOFA.Message({
    body: "What is your currency? (i.e. USD, AUD, SGD)"
  }));

};

function actuallyProcessCurrency(type, session, message) {

  let inputCurrency = message.content.body.toUpperCase();
  console.log('inputCurrency: ' + inputCurrency);

  Fiat.fetch().then((toEth) => {
    let exchangeRate = Fiat.rates[inputCurrency];

    if (exchangeRate) {
      console.log('exchangeRate: ' + exchangeRate);

      if (type == 'trade') {

        session.setWithDictionary({
          'exchangeRate': exchangeRate,
          'currency': inputCurrency,
          'step': 'location'
        });

      } else if (type == 'listing') {

        session.setWithDictionary({
          'currency': inputCurrency,
          'step': 'location_for_listing'
        });

      }

      session.reply(SOFA.Message({
        body: "Where do you want to perform this transaction? Please specify your region and country separated by a comma (i.e. Sydney, Australia)"
      }))

    } else {
      console.log('no exchangeRate for this currency!')

      session.reply(SOFA.Message({
        body: "Please specify a valid currency (i.e. USD, AUD, SGD)"
      }))

    }

  })


};

function processCurrencyForListing(session, message) {
  actuallyProcessCurrency('listing', session, message);
}

function processCurrency(session, message) {
  actuallyProcessCurrency('trade', session, message);
}

function processListingLocation(session, message) {
  actuallyProcessLocation('listing', session, message);
}

function processLocation(session, message) {

  actuallyProcessLocation('trade', session, message);

}

function actuallyProcessLocation(type, session, message) {

  console.log('actuallyProcessLocation: ' + type);

  let inputLocation = message.content.body;

  let separatedArray = inputLocation.split(',');

  if (separatedArray.length == 2) {

    let region = separatedArray[0].trim();
    let country = separatedArray[1].trim();

    console.log('region: ' + region);
    console.log('country: ' + country);

    if (type == 'trade') {
      session.setWithDictionary({
        'region': region,
        'country': country,
        'step': 'details'
      });

      session.reply(SOFA.Message({
        body: 'Please provide some details so your trader knows how to trade with you. (i.e. "Can we meet at Sydney Airport 5pm this Sunday? Please call me at 0433-000-111")'
      }))

    } else if (type == 'listing') {
      session.setWithDictionary({
        'region': region,
        'country': country,
        'step': 'confirm_listing'
      });

      confirmListingDetails(session);

    }

  } else {
    session.reply(SOFA.Message({
      body: "Please specify your region and country separated by a comma (i.e. Sydney, Australia)"
    }))
  }

}

function processDetails(session, message) {

  console.log('process details');
  console.log('session: ' + session);

  let inputDetails = message.content.body;

  console.log('inputDetails: ' + inputDetails);

  session.set('details', inputDetails);

  confirmDetails(session);


}

function confirmListingDetails(session) {

  console.log('confirm listing details');

  let currency = session.get('currency');
  let location = session.get('region') + ', ' + session.get('country');

  let text = "Please confirm your listing details:\n\n" +
    "Currency: " + currency + "\n" +
    "Location: " + location + "\n";


  let controls = [{
      type: 'button',
      label: 'Confirm',
      value: 'confirmListingDetails'
    },
    {
      type: 'button',
      label: 'Start Over',
      value: 'startOver'
    }
  ];

  session.reply(SOFA.Message({
    body: text,
    controls: controls,
    showKeyboard: false
  }))

}

function confirmDetails(session) {

  console.log('confirm details');

  let howmuch = session.get('howmuch');
  let exchangeRate = session.get('exchangeRate');
  let howmuchInFiat = howmuch * exchangeRate;
  let currency = session.get('currency');
  let location = session.get('region') + ', ' + session.get('country');
  let details = session.get('details');

  let text = "Please confirm your trade details:\n\n" +
    "Amount: " + howmuch + ` ETHs (~ ${howmuchInFiat} ${currency})` + "\n" +
    "Location: " + location + "\n" +
    "Details: " + details;

  console.log('details: ' + text);


  let controls = [{
      type: 'button',
      label: 'Confirm',
      value: 'confirmDetails'
    },
    {
      type: 'button',
      label: 'Start Over',
      value: 'startOver'
    }
  ];

  session.reply(SOFA.Message({
    body: text,
    controls: controls,
    showKeyboard: false
  }))

}
