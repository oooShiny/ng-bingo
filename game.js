'use strict';

var io;
var game;

exports.init = function(sio, socket) {
  io = sio;
  game = socket;

  game.on('playerJoined', util.playerJoined);

};

var util = {
  currentPlayers: [],
  playerJoined: function(data) {
    var sock = this;
    console.log(data);
    util.currentPlayers.push(data);
    util.playersUpdated();
  },
  playersUpdated: function() {
    io.emit('playersUpdated', util.currentPlayers);
    // game.emit('playersUpdated', util.currentPlayers);
  }
};
