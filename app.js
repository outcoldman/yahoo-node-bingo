var socketClient = require('socket.io-client'),
    fs = require('fs'),
    path = require('path');

var BingoClient = function(options) {
  var _game = 'BINGO';
  var _client = null;
  var _slots = null;

  var _checkColumn = function(row, column) {
    for (var slotPropertyName in _slots) {
      if (_slots.hasOwnProperty(slotPropertyName) 
        && slotPropertyName !== _game[row]) {
        if (_slots[slotPropertyName][column] != null) {
          console.info('Not yet, because of ' + slotPropertyName + column);
          return false;
        }
      }
    }
    return true;
  };

  var _checkRow = function(row, column) {
    for (var index = 0; index < _slots[_game[row]].length; index++) {
      if (index !== column) {
        if (_slots[_game[row]][index] != null) {
          console.info('Not yet, because of ' + _game[row] + index);
          return false;
        }
      }
    }
    return true;
  };

  var _checkDiagonal1 = function(row, column) {
    if (row !== column) {
      return false;
    }
    for (var index = 0; index < _game.length; index++) {
      if (index !== column) {
        if (_slots[_game[index]][index] != null) {
          console.info('Not yet, because of ' + _game[index] + index);
          return false;
        }
      }
    }
    return true;
  };

  var _checkDiagonal2 = function(row, column) {
    if (row !== (_game.length - column - 1)) {
      return false;
    }
    for (var index = 0; index < _game.length; index++) {
      if (index !== row) {
        if (_slots[_game[index]][_game.length - index - 1] != null) {
          console.info('Not yet, because of ' + _game[index] + (_game.length - index - 1));
          return false;
        }
      }
    }
    return true;
  };

  var _checkWin = function(row, column) {
    return _checkColumn(row, column)
      || _checkRow(row, column)
      || _checkDiagonal1(row, column)
      || _checkDiagonal2(row, column);
  };

  var _connect = function() {
    console.info('connect handler');
  };

  var _disconnect = function() {
    console.info('disconnect handler');
  };

  var _card = function(payload) {
    console.info('card handler');
    console.log('New card has been issued');
    console.dir(payload.slots);
    _slots = payload.slots;
  };

  var _number =function(number) {
    console.info('number handler');
    console.log('New card: ' + number);
    var match = /([BINGO])(\d+)/.exec(number);
    var slot = match[1];
    var number = parseInt(match[2]);

    var slotRow = _slots[slot];
    for (var index = 0; index <= slotRow.length; index++) {
      if (slotRow[index] === number) {
        slotRow[index] = null;
        if (_checkWin(_game.indexOf(slot), index)) {
          console.info('I won, emitting message to server...');
          _client.emit('bingo');
        }
        console.dir(_slots);
      }
    }
  };

  var _win = function(message) {
    console.info('win handler');
    console.log(message);
  };

  var _lose = function(message) {
    console.info('lose handler');
    console.log(message);
  };

  this.start = function() {
    if (_client) {
      throw new Error('Client already started');
    }
    _client = socketClient.connect('ws://yahoobingo.herokuapp.com');
    _client.on('connect', _connect);
    _client.on('disconnect', _disconnect);
    _client.on('card', _card);
    _client.on('number', _number);
    _client.on('win', _win);
    _client.on('lose', _lose);
    _client.emit('register', options);
  };
};

var readOptions = function(callback) {
  fs.readFile(path.join(__dirname, 'package.json'), function(err, data) {
    if (err) {
      callback(err, null);
    } else {
      var packageInfo = JSON.parse(data);
      var options = {
        name: packageInfo.author.name,
        email: packageInfo.author.email,
        url: packageInfo.homepage
      }
      callback(null, options);
    }
  });
};

var startClient = function() {
  readOptions(function(err, options) {
    if (err) {
      console.error(err);
    } else {
      console.info('Got options:');
      console.info(options)
      console.log('Starting client...');
      var client = new BingoClient(options);
      client.start();
    };
  })
};

startClient();