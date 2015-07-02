'use strict';
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
  }
};

module.exports = ['$scope', function($scope) {
  $scope.tiles = util.generateArray();
}];
