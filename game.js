'use strict';
var _ = require('underscore');
var io;
var game;

exports.init = function(sio, socket) {
  io = sio;
  game = socket;

  game.on('playerChatted', IO.playerChatted);
  game.on('playerJoined', IO.playerJoined);
  game.on('playerMoved', IO.playerMoved);
  game.on('playerQuit', IO.playerQuit);
  game.on('playerWon', IO.playerWon);

  io.emit('playersUpdated', IO.currentPlayers);

};

var IO = {
  currentPlayers: [],
  paulBot: function(data) {
    if (data.msg.indexOf('paul') > -1 || data.msg.indexOf('Paul') > -1 ||
      data.msg.indexOf('PAUL') > -1) {
      io.emit('paulChatted', null);
    }
  },
  playerChatted: function(data) {
    IO.updateConsole(data);
    IO.paulBot(data);
  },
  playerJoined: function(data) {
    IO.currentPlayers.push(data);
    IO.playersUpdated();

    IO.updateConsole({
      id: 0,
      msg: data.playerName + ' has joined the game.',
      playerName: 'admin'
    });
  },
  playerMoved: function(data) {
    _.each(IO.currentPlayers, function(v, i) {
      if (v.id === data.id) {
        v.currentCombo = data.currentCombo;
      }
    });
    IO.playersUpdated();
  },
  playerQuit: function(data) {
    _.each(IO.currentPlayers, function(v, i) {
      if (v.id === data.id) {
        IO.currentPlayers.splice(i, 1);
      }
    });
    IO.playersUpdated();
    IO.updateConsole({
      id: 0,
      msg: data.playerName +
        ' has left the game. They weren\'t that good anyway.',
      playerName: 'admin'
    });
  },
  playersUpdated: function() {
    io.emit('playersUpdated', IO.currentPlayers);
  },
  playerWon: function(data) {
    _.each(IO.currentPlayers, function(v, i) {
      if (v.id === data) {
        io.emit('playerWon', {
          id: v.id,
          playerName: v.playerName
        });
      }
    });
  },
  updateConsole: function(data) {
    io.emit('consoleUpdate', data);
  }
};
