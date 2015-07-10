'use strict';
var $ = require('jquery');
var _ = require('underscore');
// var io = require('socket.io')();
var socket = io.connect();
var util = require('../utils/');

module.exports = ['$scope', function($scope) {
  $scope.currentCombo = [];
  $scope.opponents = [];
  $scope.myId = null;
  $scope.players = [];
  $scope.tiles = util.generateArray();
  $scope.checkForWin = function() {
    $.each(util.winningCombos, function(i, v) {
      var intersect = _.intersection(v, $scope.currentCombo);
      if (intersect.toString() === v.toString()) {
        socket.emit('playerWon', $scope.myId);
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
    $scope.playerMoved();
  };
  $scope.playerMoved = function() {
    var moveData = {
      currentCombo: $scope.currentCombo,
      id: $scope.myId
    };
    socket.emit('playerMoved', moveData);
  };
  $scope.updateOpponentBoards = function() {
    if (!$scope.opponents.length) {
      $scope.$apply(function() {
        $scope.opponents = [];
      });
      return false;
    }
    $('.opponent-board__tiles').each(function(i, v) {
      var playerObj = _.find($scope.opponents, function(item) {
        return item.id === $(v).data('guid');
      });
      $.each(playerObj.currentCombo, function(i2, v2) {
        $(v).find('.opponent-board__tile').eq(v2).addClass(
          'opponent-board__tile--selected');
      });

    });
  };
  socket.on('playersUpdated', function(data) {
    $scope.opponents = [];
    $scope.players = data;
    $.each($scope.players, function(i, v) {
      if (v.id !== $scope.myId) {
        $scope.$apply(function() {
          $scope.opponents.push(v);
        });
      }
    });
    $scope.updateOpponentBoards();
  });
  socket.on('playerWon', function(data) {
    if (data.id === $scope.myId) {
      window.alert('You win!');
    } else {
      window.alert(data.playerName + 'wins!');
    }
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

  window.onunload = function() {
    socket.emit('playerQuit', $scope.myId);
  };
}];
