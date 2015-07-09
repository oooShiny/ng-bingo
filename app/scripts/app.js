'use strict';

var $ = require('jquery');
var angular = require('angular');
var util = require('./utils/');

var app = angular.module('Bingo', []);

app.controller('MainController', require('./controllers/mainController.js'));
app.directive('bingoTile', require('./directives/bingoTile.js'));

var socket = io.connect();

$('.sign-in').submit(function() {
  var data = {
    currentCombo: [],
    id: util.generateGuid(),
    playerName: $('.username').val() || 'anon'
  };
  socket.emit('playerJoined', data);
  $('.main-board h1').text(data.playerName);
  return false;
});
