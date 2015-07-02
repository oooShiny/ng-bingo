'use strict';

var $ = require('jquery');
var angular = require('angular');

var app = angular.module('Bingo', []);

app.controller('MainController', require('./controllers/mainController.js'));
app.directive('bingoTile', require('./directives/bingoTile.js'));
