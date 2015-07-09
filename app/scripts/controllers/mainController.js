'use strict';
var $ = require('jquery');
var _ = require('underscore');
// var io = require('socket.io')();
var socket = io.connect();
var util = require('../utils/');

module.exports = ['$scope', function($scope) {
  $scope.currentCombo = [];
  $scope.players = [];
  $scope.tiles = util.generateArray();
  $scope.checkForWin = function() {
    $.each(util.winningCombos, function(i, v) {
      var intersect = _.intersection(v, $scope.currentCombo);
      if (intersect.toString() === v.toString()) {
        window.alert('winner!');
      }
    });
  };

  $scope.handleClick = function(idx) {
    if (_.indexOf($scope.currentCombo, idx) === -1) {
      $scope.currentCombo.push(idx);
      $scope.currentCombo = $scope.currentCombo.sort(util.sortNumber);
    } else {
      $scope.currentCombo = _.without($scope.currentCombo, idx);
    }
    $scope.checkForWin();

  };
  socket.on('playersUpdated', function(data) {
    $scope.players = data;
  });

  $('.sign-in').submit(function() {
    var data = {
      currentCombo: [],
      id: util.generateGuid(),
      playerName: $('.username').val() || 'anon'
    };
    socket.emit('playerJoined', data);

    $scope.myId = data.id;

    $('.main-board h1').text(data.playerName);
    return false;
  });

}];
