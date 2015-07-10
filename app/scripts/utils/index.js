'use strict';
var util = {
  fedWords: require('./wordlist.js'),
  generateArray: function() {
    let arr = [];
    for (var i = 0; i < 25; i++) {
      let rand = Math.floor((Math.random() * util.fedWords.length));
      arr.push({
        word: util.fedWords[rand]
          // word: rand
      });
    }
    arr[12] = {
      word: 'free'
    };
    return arr;
  },
  generateGuid: function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  },
  sortNumber: function(a, b) {
    return a - b;
  },
  winningCombos: require('./winning-combos.js')
};

module.exports = util;
