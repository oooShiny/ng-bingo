'use strict';
var $ = require('jquery');
var _ = require('underscore');
// var io = require('socket.io')();
var socket = io.connect();


var util = {
  fedWords: require('../wordlist.js'),
  generateArray: function() {
    let arr = [];
    for (var i = 0; i < 25; i++) {
      let rand = Math.floor((Math.random() * util.fedWords.length));
      arr.push({
        word: util.fedWords[rand]
      });
    }
    arr[12] = {
      word: 'free'
    };
    return arr;
  },
  sortNumber: function(a, b) {
    return a - b;
  },
  winningCombos: require('../winning-combos')
};

module.exports = ['$scope', function($scope) {
  $scope.currentCombo = [];
  $scope.tiles = util.generateArray();
  $scope.checkForWin = function() {
    $.each(util.winningCombos, function(i, v) {
      var intersect = _.intersection(v, $scope.currentCombo);
      if (intersect.toString() === v.toString()) {
        window.alert('winner!');
      }
    });
  };
  $scope.emitter = function() {

  };
  $scope.handleClick = function(idx) {
    if (_.indexOf($scope.currentCombo, idx) === -1) {
      $scope.currentCombo.push(idx);
      $scope.currentCombo = $scope.currentCombo.sort(util.sortNumber);
    } else {
      $scope.currentCombo = _.without($scope.currentCombo, idx);
    }
    $scope.checkForWin();
    socket.emit('chat message', 'hello');


  };
  socket.on('chat message', function(msg) {
    $('body').prepend($('<li>').text(msg));
  });

}];
