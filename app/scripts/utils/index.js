'use strict';
var $ = require('jquery');
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
  modalHide: function(cssClass) {
    $('.overlay').fadeOut();
    $('.' + cssClass).fadeOut();
    $('body').removeClass('modal-open');
  },
  modalShow: function(cssClass) {
    $('.overlay').fadeIn();
    $('.' + cssClass).fadeIn();
    $('body').addClass('modal-open');
  },
  sortNumber: function(a, b) {
    return a - b;
  },
  winningCombos: require('./winning-combos.js')
};

module.exports = util;
