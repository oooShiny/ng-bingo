'use strict';
var _ = require('underscore');
var io;
var game;

exports.init = function(sio, socket) {
  io = sio;
  game = socket;

  game.on('playerJoined', IO.playerJoined);
  game.on('playerMoved', IO.playerMoved);
  game.on('playerQuit', IO.playerQuit);
  game.on('playerWon', IO.playerWon);

  io.emit('playersUpdated', IO.currentPlayers);

};

var IO = {
  currentPlayers: [],
  playerJoined: function(data) {
    IO.currentPlayers.push(data);
    IO.playersUpdated();
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
      if (v.id === data) {
        IO.currentPlayers.splice(i, 1);
      }
    });
    IO.playersUpdated();
  },
  playersUpdated: function() {
    io.emit('playersUpdated', IO.currentPlayers);
  },
  playerWon: function(data) {
    console.log(data);
    _.each(IO.currentPlayers, function(v, i) {
      if (v.id === data) {
        io.emit('playerWon', {
          id: v.id,
          playerName: v.playerName
        });
      }
    });
  }
};
