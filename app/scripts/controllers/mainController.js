'use strict';
var $ = require('jquery');
var _ = require('underscore');
var socket = io.connect();
var util = require('../utils/');

module.exports = ['$scope', function($scope) {
  $scope.currentCombo = [];
  $scope.opponents = [];
  $scope.myId = null;
  $scope.myName = null;
  $scope.players = [];
  $scope.tiles = util.generateArray();
  $scope.winner = null;

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

  $scope.restartGame = function() {
    window.location.reload();
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

  socket.on('consoleUpdate', function(data) {
    var cssClass = data.id === $scope.myId ? 'me' : 'opponent';
    var template = '';
    if (data.playerName === 'admin') {
      template = '<div class="admin">' + data.msg + '</div>';
    } else {
      template = '<div class="' + cssClass + '"><strong>' + data.playerName +
        ':</strong> ' + data.msg + '</div>';
    }
    $('.console-output').append(template);
  });

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
    $scope.winner = data.playerName;
    util.modalShow('modal__game-over');
  });

  $('.sign-in-form').submit(function() {
    var data = {
      currentCombo: [],
      id: util.generateGuid(),
      playerName: $('.username').val() || 'anon'
    };
    socket.emit('playerJoined', data);
    $scope.myId = data.id;
    $scope.myName = data.playerName;
    util.modalHide('modal__sign-in');
    $('.main-board h1').fadeTo(1000, 1);
    return false;
  });

  $('.console-form').submit(function() {
    socket.emit('playerChatted', {
      id: $scope.myId,
      msg: $('.console-form__message').val(),
      playerName: $scope.myName
    });
    return false;
  });

  window.onunload = function() {
    socket.emit('playerQuit', {
      id: $scope.myId,
      playerName: $scope.myName
    });
  };
}];
