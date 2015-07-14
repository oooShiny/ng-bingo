'use strict';
var $ = require('jquery');
var util = {
  calcHeight: function(cssClass) {
    var $el = $('.' + cssClass);
    $el.show();
    var height = $el.height();
    $el.hide();
    return height;
  },
  fedWords: require('./wordlist.js'),
  generateArray: function(dataSet) {
    let arr = [];
    for (var i = 0; i < 25; i++) {
      let rand = Math.floor((Math.random() * dataSet.length));
      arr.push({
        word: dataSet[rand]
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
    var $el = $('.' + cssClass);
    $el.css('margin-top', '-' + util.calcHeight(cssClass) / 2 + 'px');
    $('.overlay').fadeIn();
    $el.fadeIn();
    $('body').addClass('modal-open');
  },
  paulPhrases: require('./paul-phrases.js'),
  randomizer: function(dataSet) {
    let rand = Math.floor((Math.random() * dataSet.length));
    return dataSet[rand];
  },
  sortNumber: function(a, b) {
    return a - b;
  },
  winningCombos: require('./winning-combos.js'),
  winningImages: require('./winning-images.js'),
  winningPhrases: require('./winning-phrases.js')
};

module.exports = util;
