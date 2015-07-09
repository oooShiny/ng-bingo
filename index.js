'use strict';
var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var game = require('./game');
//
// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/index.html');
// });

app.use(express.static('build'));

io.on('connection', function(socket) {
  // socket.on('chat message', function(msg) {
  //   io.emit('chat message', msg);
  // });
  game.init(io, socket);
});

http.listen(8000, function() {
  console.log('listening on *:8000');
});
