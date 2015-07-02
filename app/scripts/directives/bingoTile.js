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
        //console.log(attrs.index);
        scope.$parent.handleClick(attrs.index);
        el.toggleClass('tile--selected');
      };
    }
  };
};
