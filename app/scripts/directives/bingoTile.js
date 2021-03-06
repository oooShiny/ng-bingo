var $ = require('jquery');
module.exports = function() {
  'use strict';
  return {
    scope: {
      tile: '='
    },
    templateUrl: '/scripts/directives/bingoTile.html',
    link: function(scope, el, attrs) {
      scope.selectTile = function(e) {
        scope.$parent.handleClick(parseInt(attrs.index));
        el.toggleClass('tile--selected');
      };
    }
  };
};
