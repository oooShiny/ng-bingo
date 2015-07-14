var $ = require('jquery');
module.exports = function() {
  'use strict';
  return {
    scope: {
      opponent: '='
    },
    templateUrl: '/scripts/directives/opponentBoard.html',
    link: function(scope, el, attrs) {
      scope.selectTile = function(e) {
        scope.$parent.handleClick(parseInt(attrs.index));
        el.toggleClass('tile--selected');
      };
    }
  };
};
