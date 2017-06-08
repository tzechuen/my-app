const Bot = require('./lib/Bot')
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')

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


bot.hear('reset', (session, message) => {
  session.reset()
  session.reply(SOFA.Message({
    body: "I've reset your state."
  }));
})

function onMessage(session, message) {


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

    }

  } else if (body.includes('hi') || body.includes('hello')) {
    welcome(session);
  }

}


function onCommand(session, command) {



  switch (command.content.value) {

    case 'ethForCash':
      askHowMuch(session);
      break

    case 'cashForEth':
      askHowMuch(session);
      break

    case 'confirmDetails':
      console.log('Confirmed Details');
      break

    case 'startOver':
      console.log('Start Over');

      session.reset();
      welcome(session);

      break

  }

}

function askHowMuch(session) {

  session.set('step', 'howmuch');

  console.log('step set: ' + session.get('step'));

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

function processCurrency(session, message) {

  let inputCurrency = message.content.body.toUpperCase();
  console.log('inputCurrency: ' + inputCurrency);

  Fiat.fetch().then((toEth) => {
    let exchangeRate = Fiat.rates[inputCurrency];

    if (exchangeRate) {
      console.log('exchangeRate: ' + exchangeRate);

      // session.set('exchangeRate', exchangeRate);
      // session.set('currency', inputCurrency);
      // session.set('step', 'location');

      session.setWithDictionary({
        'exchangeRate': exchangeRate,
        'currency': inputCurrency,
        'step': 'location'
      });

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

}


function processLocation(session, message) {

  let inputLocation = message.content.body;

  let separatedArray = inputLocation.split(',');

  if (separatedArray.length == 2) {

    let region = separatedArray[0].trim();
    let country = separatedArray[1].trim();

    console.log('region: ' + region);
    console.log('country: ' + country);

    // session.set('region', region);
    // session.set('country', country);
    //
    // session.set('step', 'details');

    session.setWithDictionary({
      'region': region,
      'country': country,
      'step': 'details'
    });

    session.reply(SOFA.Message({
      body: 'Please provide some details so your trader knows how to perform the trade. (i.e. "Can we meet at Sydney Airport 5pm this Sunday? Please call me at 0433-000-111")'
    }))


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






function welcome(session) {

  let controls = [{
      type: 'button',
      label: 'I want to get ETH with cash',
      value: 'ethForCash'
    },
    {
      type: 'button',
      label: 'I want to get cash for my ETHs',
      value: 'cashForEth'
    }
  ]

  session.reply(SOFA.Message({
    body: 'Hello there! Welcome to Eth2Cash. How can I help you today?',
    controls: controls,
    showKeyboard: false
  }))
}
