'use strict';
var $ = require('jquery');
var _ = require('underscore');

var util = {
  generateArray: function() {
    let arr = [];
    for (var i = 0; i < 25; i++) {
      arr.push({
        word: Math.floor((Math.random() * 100) + 1)
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
  winningCombos: [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    [0, 6, 12, 12, 18, 24],
    [4, 8, 12, 16, 20]
  ]
};

module.exports = ['$scope', function($scope) {
  $scope.currentCombo = [];
  $scope.tiles = util.generateArray();
  $scope.handleClick = function(idx) {
    if (_.indexOf($scope.currentCombo, idx) === -1) {
      $scope.currentCombo.push(idx);
      $scope.currentCombo = $scope.currentCombo.sort(util.sortNumber);
    } else {
      $scope.currentCombo = _.without($scope.currentCombo, idx);
    }
    $scope.checkForWin();
  };
  $scope.checkForWin = function() {
    $.each(util.winningCombos, function(i, v) {
      $.each(v, function(i2, v2) {
        var matches = 0;
        $.each($scope.currentCombo, function(i3, v3) {
          console.log(v2, v3);
          if (v2 === parseInt(v3)) {
            matches += 1;
          }
        });
        if (matches >= 5) {
          alert('BINGO');
          return false;
        }
        console.log(matches);
      });
    });
  };

}];
