'use strict';

var $ = require('jquery');
var angular = require('angular');
var util = require('./utils/');

var app = angular.module('Bingo', []);

app.controller('MainController', require('./controllers/mainController.js'));
app.directive('bingoTile', require('./directives/bingoTile.js'));
app.directive('opponentBoard', require('./directives/opponentBoard.js'));
