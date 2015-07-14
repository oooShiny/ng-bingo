(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./app/scripts/app.js":[function(require,module,exports){
'use strict';

var $ = require('jquery');
var angular = require('angular');
var util = require('./utils/');

var app = angular.module('Bingo', []);

app.controller('MainController', require('./controllers/mainController.js'));
app.directive('bingoTile', require('./directives/bingoTile.js'));
app.directive('opponentBoard', require('./directives/opponentBoard.js'));

},{"./controllers/mainController.js":"/Users/REDLIST/Sites/fed-bingo/app/scripts/controllers/mainController.js","./directives/bingoTile.js":"/Users/REDLIST/Sites/fed-bingo/app/scripts/directives/bingoTile.js","./directives/opponentBoard.js":"/Users/REDLIST/Sites/fed-bingo/app/scripts/directives/opponentBoard.js","./utils/":"/Users/REDLIST/Sites/fed-bingo/app/scripts/utils/index.js","angular":"/Users/REDLIST/Sites/fed-bingo/app/scripts/libs/angular.min.js","jquery":"/Users/REDLIST/Sites/fed-bingo/node_modules/jquery/dist/jquery.js"}],"/Users/REDLIST/Sites/fed-bingo/app/scripts/controllers/mainController.js":[function(require,module,exports){
'use strict';
var $ = require('jquery');
var _ = require('underscore');
var socket = io.connect();
var util = require('../utils/');

module.exports = ['$scope', function ($scope) {
  $scope.currentCombo = [];
  $scope.opponents = [];
  $scope.myId = null;
  $scope.myName = null;
  $scope.players = [];
  $scope.tiles = util.generateArray(util.fedWords);
  $scope.winner = null;
  $scope.winningImage = util.randomizer(util.winningImages);
  $scope.winningPhrase = util.randomizer(util.winningPhrases);

  $scope.checkForWin = function () {
    $.each(util.winningCombos, function (i, v) {
      var intersect = _.intersection(v, $scope.currentCombo);
      if (intersect.toString() === v.toString()) {
        socket.emit('playerWon', $scope.myId);
      }
    });
  };

  $scope.handleClick = function (idx) {
    if (_.indexOf($scope.currentCombo, idx) === -1) {
      $scope.currentCombo.push(idx);
      $scope.currentCombo = $scope.currentCombo.sort(util.sortNumber);
    } else {
      $scope.currentCombo = _.without($scope.currentCombo, idx);
    }
    $scope.checkForWin();
    $scope.playerMoved();
  };

  $scope.playerMoved = function () {
    var moveData = {
      currentCombo: $scope.currentCombo,
      id: $scope.myId
    };
    socket.emit('playerMoved', moveData);
  };

  $scope.restartGame = function () {
    window.location.reload();
  };

  $scope.updateOpponentBoards = function () {
    if (!$scope.opponents.length) {
      $scope.$apply(function () {
        $scope.opponents = [];
      });
      return false;
    }
    $('.opponent-board__tiles').each(function (i, v) {
      var playerObj = _.find($scope.opponents, function (item) {
        return item.id === $(v).data('guid');
      });
      $.each(playerObj.currentCombo, function (i2, v2) {
        $(v).find('.opponent-board__tile').eq(v2).addClass('opponent-board__tile--selected');
      });
    });
  };

  socket.on('consoleUpdate', function (data) {
    var cssClass = data.id === $scope.myId ? 'me' : 'opponent';
    var template = '';
    if (data.playerName === 'admin') {
      template = '<div class="admin">' + data.msg + '</div>';
    } else {
      template = '<div class="' + cssClass + '"><strong>' + data.playerName + ':</strong> ' + data.msg + '</div>';
    }
    $('.console-output').append(template);
  });

  socket.on('paulChatted', function (data) {
    console.log('paulchatted');
    var template = '<div class="paul"><strong>Paul:</strong> ' + util.randomizer(util.paulPhrases);+'</div>';

    $('.console-output').append(template);
  });

  socket.on('playersUpdated', function (data) {
    $scope.opponents = [];
    $scope.players = data;
    $.each($scope.players, function (i, v) {
      if (v.id !== $scope.myId) {
        $scope.$apply(function () {
          $scope.opponents.push(v);
        });
      }
    });
    $scope.updateOpponentBoards();
  });

  socket.on('playerWon', function (data) {
    $scope.winner = data.playerName;
    util.modalShow('modal__game-over');
  });

  $('.sign-in-form').submit(function () {
    var data = {
      currentCombo: [],
      id: util.generateGuid(),
      playerName: $('.username').val() || 'anon'
    };
    socket.emit('playerJoined', data);
    $scope.myId = data.id;
    $scope.myName = data.playerName;
    util.modalHide('modal__sign-in');
    $('.main-board h1').fadeTo(1000, 1);
    return false;
  });

  $('.console-form').submit(function () {
    socket.emit('playerChatted', {
      id: $scope.myId,
      msg: $('.console-form__message').val(),
      playerName: $scope.myName
    });
    $('.console-form__message').val('');
    return false;
  });

  window.onunload = function () {
    socket.emit('playerQuit', {
      id: $scope.myId,
      playerName: $scope.myName
    });
  };
}];

},{"../utils/":"/Users/REDLIST/Sites/fed-bingo/app/scripts/utils/index.js","jquery":"/Users/REDLIST/Sites/fed-bingo/node_modules/jquery/dist/jquery.js","underscore":"/Users/REDLIST/Sites/fed-bingo/node_modules/underscore/underscore.js"}],"/Users/REDLIST/Sites/fed-bingo/app/scripts/directives/bingoTile.js":[function(require,module,exports){
'use strict';

var $ = require('jquery');
module.exports = function () {
  'use strict';
  return {
    scope: {
      tile: '='
    },
    templateUrl: '/scripts/directives/bingoTile.html',
    link: function link(scope, el, attrs) {
      scope.selectTile = function (e) {
        scope.$parent.handleClick(parseInt(attrs.index));
        el.toggleClass('tile--selected');
      };
    }
  };
};

},{"jquery":"/Users/REDLIST/Sites/fed-bingo/node_modules/jquery/dist/jquery.js"}],"/Users/REDLIST/Sites/fed-bingo/app/scripts/directives/opponentBoard.js":[function(require,module,exports){
'use strict';

var $ = require('jquery');
module.exports = function () {
  'use strict';
  return {
    scope: {
      opponent: '='
    },
    templateUrl: '/scripts/directives/opponentBoard.html',
    link: function link(scope, el, attrs) {
      scope.selectTile = function (e) {
        scope.$parent.handleClick(parseInt(attrs.index));
        el.toggleClass('tile--selected');
      };
    }
  };
};

},{"jquery":"/Users/REDLIST/Sites/fed-bingo/node_modules/jquery/dist/jquery.js"}],"/Users/REDLIST/Sites/fed-bingo/app/scripts/libs/angular.min.js":[function(require,module,exports){
(function (global){
;__browserify_shim_require__=require;(function browserifyShim(module, exports, require, define, browserify_shim__define__module__export__) {
"use strict";(function(Q,W,t){"use strict";function R(b){return function(){var a=arguments[0],c;c = "[" + (b?b + ":":"") + a + "] http://errors.angularjs.org/1.3.15/" + (b?b + "/":"") + a;for(a = 1;a < arguments.length;a++) {c = c + (1 == a?"?":"&") + "p" + (a - 1) + "=";var d=encodeURIComponent,e;e = arguments[a];e = "function" == typeof e?e.toString().replace(/ \{[\s\S]*$/,""):"undefined" == typeof e?"undefined":"string" != typeof e?JSON.stringify(e):e;c += d(e);}return Error(c);};}function Sa(b){if(null == b || Ta(b))return !1;var a=b.length;return b.nodeType === qa && a?!0:C(b) || H(b) || 0 === a || "number" === typeof a && 0 < a && a - 1 in b;}function r(b,a,c){var d,e;if(b)if(G(b))for(d in b) "prototype" == d || "length" == d || "name" == d || b.hasOwnProperty && !b.hasOwnProperty(d) || a.call(c,b[d],d,b);else if(H(b) || Sa(b)){var f="object" !== typeof b;d = 0;for(e = b.length;d < e;d++) (f || d in b) && a.call(c,b[d],d,b);}else if(b.forEach && b.forEach !== r)b.forEach(a,c,b);else for(d in b) b.hasOwnProperty(d) && a.call(c,b[d],d,b);return b;}function Ed(b,a,c){for(var d=Object.keys(b).sort(),e=0;e < d.length;e++) a.call(c,b[d[e]],d[e]);return d;}function mc(b){return function(a,c){b(c,a);};}function Fd(){return ++ob;}function nc(b,a){a?b.$$hashKey = a:delete b.$$hashKey;}function w(b){for(var a=b.$$hashKey,c=1,d=arguments.length;c < d;c++) {var e=arguments[c];if(e)for(var f=Object.keys(e),g=0,h=f.length;g < h;g++) {var l=f[g];b[l] = e[l];}}nc(b,a);return b;}function aa(b){return parseInt(b,10);}function Ob(b,a){return w(Object.create(b),a);}function E(){}function ra(b){return b;}function ea(b){return function(){return b;};}function x(b){return "undefined" === typeof b;}function y(b){return "undefined" !== typeof b;}function J(b){return null !== b && "object" === typeof b;}function C(b){return "string" === typeof b;}function Y(b){return "number" === typeof b;}function ga(b){return "[object Date]" === Ca.call(b);}function G(b){return "function" === typeof b;}function Ua(b){return "[object RegExp]" === Ca.call(b);}function Ta(b){return b && b.window === b;}function Va(b){return b && b.$evalAsync && b.$watch;}function Wa(b){return "boolean" === typeof b;}function oc(b){return !(!b || !(b.nodeName || b.prop && b.attr && b.find));}function Gd(b){var a={};b = b.split(",");var c;for(c = 0;c < b.length;c++) a[b[c]] = !0;return a;}function va(b){return z(b.nodeName || b[0] && b[0].nodeName);}function Xa(b,a){var c=b.indexOf(a);0 <= c && b.splice(c,1);return a;}function Da(b,a,c,d){if(Ta(b) || Va(b))throw Ja("cpws");if(a){if(b === a)throw Ja("cpi");c = c || [];d = d || [];if(J(b)){var e=c.indexOf(b);if(-1 !== e)return d[e];c.push(b);d.push(a);}if(H(b))for(var f=a.length = 0;f < b.length;f++) e = Da(b[f],null,c,d),J(b[f]) && (c.push(b[f]),d.push(e)),a.push(e);else {var g=a.$$hashKey;H(a)?a.length = 0:r(a,function(b,c){delete a[c];});for(f in b) b.hasOwnProperty(f) && (e = Da(b[f],null,c,d),J(b[f]) && (c.push(b[f]),d.push(e)),a[f] = e);nc(a,g);}}else if(a = b)H(b)?a = Da(b,[],c,d):ga(b)?a = new Date(b.getTime()):Ua(b)?(a = new RegExp(b.source,b.toString().match(/[^\/]*$/)[0]),a.lastIndex = b.lastIndex):J(b) && (e = Object.create(Object.getPrototypeOf(b)),a = Da(b,e,c,d));return a;}function sa(b,a){if(H(b)){a = a || [];for(var c=0,d=b.length;c < d;c++) a[c] = b[c];}else if(J(b))for(c in (a = a || {},b)) if("$" !== c.charAt(0) || "$" !== c.charAt(1))a[c] = b[c];return a || b;}function ha(_x12,_x13){var _again=true;_function: while(_again) {var b=_x12,a=_x13;c = d = undefined;_again = false;if(b === a)return !0;if(null === b || null === a)return !1;if(b !== b && a !== a)return !0;var c=typeof b,d;if(c == typeof a && "object" == c)if(H(b)){if(!H(a))return !1;if((c = b.length) == a.length){for(d = 0;d < c;d++) if(!ha(b[d],a[d]))return !1;return !0;}}else {if(ga(b)){if(ga(a)){_x12 = b.getTime();_x13 = a.getTime();_again = true;continue _function;}else {return !1;}}if(Ua(b))return Ua(a)?b.toString() == a.toString():!1;if(Va(b) || Va(a) || Ta(b) || Ta(a) || H(a) || ga(a) || Ua(a))return !1;c = {};for(d in b) if("$" !== d.charAt(0) && !G(b[d])){if(!ha(b[d],a[d]))return !1;c[d] = !0;}for(d in a) if(!c.hasOwnProperty(d) && "$" !== d.charAt(0) && a[d] !== t && !G(a[d]))return !1;return !0;}return !1;}}function Ya(b,a,c){return b.concat(Za.call(a,c));}function pc(b,a){var c=2 < arguments.length?Za.call(arguments,2):[];return !G(a) || a instanceof RegExp?a:c.length?function(){return arguments.length?a.apply(b,Ya(c,arguments,0)):a.apply(b,c);}:function(){return arguments.length?a.apply(b,arguments):a.call(b);};}function Hd(b,a){var c=a;"string" === typeof b && "$" === b.charAt(0) && "$" === b.charAt(1)?c = t:Ta(a)?c = "$WINDOW":a && W === a?c = "$DOCUMENT":Va(a) && (c = "$SCOPE");return c;}function $a(b,a){if("undefined" === typeof b)return t;Y(a) || (a = a?2:null);return JSON.stringify(b,Hd,a);}function qc(b){return C(b)?JSON.parse(b):b;}function wa(b){b = A(b).clone();try{b.empty();}catch(a) {}var c=A("<div>").append(b).html();try{return b[0].nodeType === pb?z(c):c.match(/^(<[^>]+>)/)[1].replace(/^<([\w\-]+)/,function(a,b){return "<" + z(b);});}catch(d) {return z(c);}}function rc(b){try{return decodeURIComponent(b);}catch(a) {}}function sc(b){var a={},c,d;r((b || "").split("&"),function(b){b && (c = b.replace(/\+/g,"%20").split("="),d = rc(c[0]),y(d) && (b = y(c[1])?rc(c[1]):!0,tc.call(a,d)?H(a[d])?a[d].push(b):a[d] = [a[d],b]:a[d] = b));});return a;}function Pb(b){var a=[];r(b,function(b,d){H(b)?r(b,function(b){a.push(Ea(d,!0) + (!0 === b?"":"=" + Ea(b,!0)));}):a.push(Ea(d,!0) + (!0 === b?"":"=" + Ea(b,!0)));});return a.length?a.join("&"):"";}function qb(b){return Ea(b,!0).replace(/%26/gi,"&").replace(/%3D/gi,"=").replace(/%2B/gi,"+");}function Ea(b,a){return encodeURIComponent(b).replace(/%40/gi,"@").replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%3B/gi,";").replace(/%20/g,a?"%20":"+");}function Id(b,a){var c,d,e=rb.length;b = A(b);for(d = 0;d < e;++d) if((c = rb[d] + a,C(c = b.attr(c))))return c;return null;}function Jd(b,a){var c,d,e={};r(rb,function(a){a += "app";!c && b.hasAttribute && b.hasAttribute(a) && (c = b,d = b.getAttribute(a));});r(rb,function(a){a += "app";var e;!c && (e = b.querySelector("[" + a.replace(":","\\:") + "]")) && (c = e,d = e.getAttribute(a));});c && (e.strictDi = null !== Id(c,"strict-di"),a(c,d?[d]:[],e));}function uc(b,a,c){J(c) || (c = {});c = w({strictDi:!1},c);var d=function d(){b = A(b);if(b.injector()){var d=b[0] === W?"document":wa(b);throw Ja("btstrpd",d.replace(/</,"&lt;").replace(/>/,"&gt;"));}a = a || [];a.unshift(["$provide",function(a){a.value("$rootElement",b);}]);c.debugInfoEnabled && a.push(["$compileProvider",function(a){a.debugInfoEnabled(!0);}]);a.unshift("ng");d = ab(a,c.strictDi);d.invoke(["$rootScope","$rootElement","$compile","$injector",function(a,b,c,d){a.$apply(function(){b.data("$injector",d);c(b)(a);});}]);return d;},e=/^NG_ENABLE_DEBUG_INFO!/,f=/^NG_DEFER_BOOTSTRAP!/;Q && e.test(Q.name) && (c.debugInfoEnabled = !0,Q.name = Q.name.replace(e,""));if(Q && !f.test(Q.name))return d();Q.name = Q.name.replace(f,"");ca.resumeBootstrap = function(b){r(b,function(b){a.push(b);});return d();};G(ca.resumeDeferredBootstrap) && ca.resumeDeferredBootstrap();}function Kd(){Q.name = "NG_ENABLE_DEBUG_INFO!" + Q.name;Q.location.reload();}function Ld(b){b = ca.element(b).injector();if(!b)throw Ja("test");return b.get("$$testability");}function vc(b,a){a = a || "_";return b.replace(Md,function(b,d){return (d?a:"") + b.toLowerCase();});}function Nd(){var b;wc || ((ta = Q.jQuery) && ta.fn.on?(A = ta,w(ta.fn,{scope:Ka.scope,isolateScope:Ka.isolateScope,controller:Ka.controller,injector:Ka.injector,inheritedData:Ka.inheritedData}),b = ta.cleanData,ta.cleanData = function(a){var c;if(Qb)Qb = !1;else for(var d=0,e;null != (e = a[d]);d++) (c = ta._data(e,"events")) && c.$destroy && ta(e).triggerHandler("$destroy");b(a);}):A = T,ca.element = A,wc = !0);}function Rb(b,a,c){if(!b)throw Ja("areq",a || "?",c || "required");return b;}function sb(b,a,c){c && H(b) && (b = b[b.length - 1]);Rb(G(b),a,"not a function, got " + (b && "object" === typeof b?b.constructor.name || "Object":typeof b));return b;}function La(b,a){if("hasOwnProperty" === b)throw Ja("badname",a);}function xc(b,a,c){if(!a)return b;a = a.split(".");for(var d,e=b,f=a.length,g=0;g < f;g++) d = a[g],b && (b = (e = b)[d]);return !c && G(b)?pc(e,b):b;}function tb(b){var a=b[0];b = b[b.length - 1];var c=[a];do {a = a.nextSibling;if(!a)break;c.push(a);}while(a !== b);return A(c);}function ia(){return Object.create(null);}function Od(b){function a(a,b,c){return a[b] || (a[b] = c());}var c=R("$injector"),d=R("ng");b = a(b,"angular",Object);b.$$minErr = b.$$minErr || R;return a(b,"module",function(){var b={};return function(f,g,h){if("hasOwnProperty" === f)throw d("badname","module");g && b.hasOwnProperty(f) && (b[f] = null);return a(b,f,function(){function a(c,d,e,f){f || (f = b);return function(){f[e || "push"]([c,d,arguments]);return u;};}if(!g)throw c("nomod",f);var b=[],d=[],e=[],q=a("$injector","invoke","push",d),u={_invokeQueue:b,_configBlocks:d,_runBlocks:e,requires:g,name:f,provider:a("$provide","provider"),factory:a("$provide","factory"),service:a("$provide","service"),value:a("$provide","value"),constant:a("$provide","constant","unshift"),animation:a("$animateProvider","register"),filter:a("$filterProvider","register"),controller:a("$controllerProvider","register"),directive:a("$compileProvider","directive"),config:q,run:function run(a){e.push(a);return this;}};h && q(h);return u;});};});}function Pd(b){w(b,{bootstrap:uc,copy:Da,extend:w,equals:ha,element:A,forEach:r,injector:ab,noop:E,bind:pc,toJson:$a,fromJson:qc,identity:ra,isUndefined:x,isDefined:y,isString:C,isFunction:G,isObject:J,isNumber:Y,isElement:oc,isArray:H,version:Qd,isDate:ga,lowercase:z,uppercase:ub,callbacks:{counter:0},getTestability:Ld,$$minErr:R,$$csp:bb,reloadWithDebugInfo:Kd});cb = Od(Q);try{cb("ngLocale");}catch(a) {cb("ngLocale",[]).provider("$locale",Rd);}cb("ng",["ngLocale"],["$provide",function(a){a.provider({$$sanitizeUri:Sd});a.provider("$compile",yc).directive({a:Td,input:zc,textarea:zc,form:Ud,script:Vd,select:Wd,style:Xd,option:Yd,ngBind:Zd,ngBindHtml:$d,ngBindTemplate:ae,ngClass:be,ngClassEven:ce,ngClassOdd:de,ngCloak:ee,ngController:fe,ngForm:ge,ngHide:he,ngIf:ie,ngInclude:je,ngInit:ke,ngNonBindable:le,ngPluralize:me,ngRepeat:ne,ngShow:oe,ngStyle:pe,ngSwitch:qe,ngSwitchWhen:re,ngSwitchDefault:se,ngOptions:te,ngTransclude:ue,ngModel:ve,ngList:we,ngChange:xe,pattern:Ac,ngPattern:Ac,required:Bc,ngRequired:Bc,minlength:Cc,ngMinlength:Cc,maxlength:Dc,ngMaxlength:Dc,ngValue:ye,ngModelOptions:ze}).directive({ngInclude:Ae}).directive(vb).directive(Ec);a.provider({$anchorScroll:Be,$animate:Ce,$browser:De,$cacheFactory:Ee,$controller:Fe,$document:Ge,$exceptionHandler:He,$filter:Fc,$interpolate:Ie,$interval:Je,$http:Ke,$httpBackend:Le,$location:Me,$log:Ne,$parse:Oe,$rootScope:Pe,$q:Qe,$$q:Re,$sce:Se,$sceDelegate:Te,$sniffer:Ue,$templateCache:Ve,$templateRequest:We,$$testability:Xe,$timeout:Ye,$window:Ze,$$rAF:$e,$$asyncCallback:af,$$jqLite:bf});}]);}function db(b){return b.replace(cf,function(a,b,d,e){return e?d.toUpperCase():d;}).replace(df,"Moz$1");}function Gc(b){b = b.nodeType;return b === qa || !b || 9 === b;}function Hc(b,a){var c,d,e=a.createDocumentFragment(),f=[];if(Sb.test(b)){c = c || e.appendChild(a.createElement("div"));d = (ef.exec(b) || ["",""])[1].toLowerCase();d = ja[d] || ja._default;c.innerHTML = d[1] + b.replace(ff,"<$1></$2>") + d[2];for(d = d[0];d--;) c = c.lastChild;f = Ya(f,c.childNodes);c = e.firstChild;c.textContent = "";}else f.push(a.createTextNode(b));e.textContent = "";e.innerHTML = "";r(f,function(a){e.appendChild(a);});return e;}function T(b){if(b instanceof T)return b;var a;C(b) && (b = N(b),a = !0);if(!(this instanceof T)){if(a && "<" != b.charAt(0))throw Tb("nosel");return new T(b);}if(a){a = W;var c;b = (c = gf.exec(b))?[a.createElement(c[1])]:(c = Hc(b,a))?c.childNodes:[];}Ic(this,b);}function Ub(b){return b.cloneNode(!0);}function wb(b,a){a || xb(b);if(b.querySelectorAll)for(var c=b.querySelectorAll("*"),d=0,e=c.length;d < e;d++) xb(c[d]);}function Jc(b,a,c,d){if(y(d))throw Tb("offargs");var e=(d = yb(b)) && d.events,f=d && d.handle;if(f)if(a)r(a.split(" "),function(a){if(y(c)){var d=e[a];Xa(d || [],c);if(d && 0 < d.length)return;}b.removeEventListener(a,f,!1);delete e[a];});else for(a in e) "$destroy" !== a && b.removeEventListener(a,f,!1),delete e[a];}function xb(b,a){var c=b.ng339,d=c && zb[c];d && (a?delete d.data[a]:(d.handle && (d.events.$destroy && d.handle({},"$destroy"),Jc(b)),delete zb[c],b.ng339 = t));}function yb(b,a){var c=b.ng339,c=c && zb[c];a && !c && (b.ng339 = c = ++hf,c = zb[c] = {events:{},data:{},handle:t});return c;}function Vb(b,a,c){if(Gc(b)){var d=y(c),e=!d && a && !J(a),f=!a;b = (b = yb(b,!e)) && b.data;if(d)b[a] = c;else {if(f)return b;if(e)return b && b[a];w(b,a);}}}function Ab(b,a){return b.getAttribute?-1 < (" " + (b.getAttribute("class") || "") + " ").replace(/[\n\t]/g," ").indexOf(" " + a + " "):!1;}function Bb(b,a){a && b.setAttribute && r(a.split(" "),function(a){b.setAttribute("class",N((" " + (b.getAttribute("class") || "") + " ").replace(/[\n\t]/g," ").replace(" " + N(a) + " "," ")));});}function Cb(b,a){if(a && b.setAttribute){var c=(" " + (b.getAttribute("class") || "") + " ").replace(/[\n\t]/g," ");r(a.split(" "),function(a){a = N(a);-1 === c.indexOf(" " + a + " ") && (c += a + " ");});b.setAttribute("class",N(c));}}function Ic(b,a){if(a)if(a.nodeType)b[b.length++] = a;else {var c=a.length;if("number" === typeof c && a.window !== a){if(c)for(var d=0;d < c;d++) b[b.length++] = a[d];}else b[b.length++] = a;}}function Kc(b,a){return Db(b,"$" + (a || "ngController") + "Controller");}function Db(b,a,c){9 == b.nodeType && (b = b.documentElement);for(a = H(a)?a:[a];b;) {for(var d=0,e=a.length;d < e;d++) if((c = A.data(b,a[d])) !== t)return c;b = b.parentNode || 11 === b.nodeType && b.host;}}function Lc(b){for(wb(b,!0);b.firstChild;) b.removeChild(b.firstChild);}function Mc(b,a){a || wb(b);var c=b.parentNode;c && c.removeChild(b);}function jf(b,a){a = a || Q;if("complete" === a.document.readyState)a.setTimeout(b);else A(a).on("load",b);}function Nc(b,a){var c=Eb[a.toLowerCase()];return c && Oc[va(b)] && c;}function kf(b,a){var c=b.nodeName;return ("INPUT" === c || "TEXTAREA" === c) && Pc[a];}function lf(b,a){var c=(function(_c){function c(_x,_x2){return _c.apply(this,arguments);}c.toString = function(){return _c.toString();};return c;})(function(c,e){c.isDefaultPrevented = function(){return c.defaultPrevented;};var f=a[e || c.type],g=f?f.length:0;if(g){if(x(c.immediatePropagationStopped)){var h=c.stopImmediatePropagation;c.stopImmediatePropagation = function(){c.immediatePropagationStopped = !0;c.stopPropagation && c.stopPropagation();h && h.call(c);};}c.isImmediatePropagationStopped = function(){return !0 === c.immediatePropagationStopped;};1 < g && (f = sa(f));for(var l=0;l < g;l++) c.isImmediatePropagationStopped() || f[l].call(b,c);}});c.elem = b;return c;}function bf(){this.$get = function(){return w(T,{hasClass:function hasClass(b,a){b.attr && (b = b[0]);return Ab(b,a);},addClass:function addClass(b,a){b.attr && (b = b[0]);return Cb(b,a);},removeClass:function removeClass(b,a){b.attr && (b = b[0]);return Bb(b,a);}});};}function Ma(b,a){var c=b && b.$$hashKey;if(c)return ("function" === typeof c && (c = b.$$hashKey()),c);c = typeof b;return c = "function" == c || "object" == c && null !== b?b.$$hashKey = c + ":" + (a || Fd)():c + ":" + b;}function eb(b,a){if(a){var c=0;this.nextUid = function(){return ++c;};}r(b,this.put,this);}function mf(b){return (b = b.toString().replace(Qc,"").match(Rc))?"function(" + (b[1] || "").replace(/[\s\r\n]+/," ") + ")":"fn";}function ab(b,a){function c(a){return function(b,c){if(J(b))r(b,mc(a));else return a(b,c);};}function d(a,b){La(a,"service");if(G(b) || H(b))b = q.instantiate(b);if(!b.$get)throw Fa("pget",a);return p[a + "Provider"] = b;}function e(a,b){return function(){var c=s.invoke(b,this);if(x(c))throw Fa("undef",a);return c;};}function f(a,b,c){return d(a,{$get:!1 !== c?e(a,b):b});}function g(a){var b=[],c;r(a,function(a){function d(a){var b,c;b = 0;for(c = a.length;b < c;b++) {var e=a[b],f=q.get(e[0]);f[e[1]].apply(f,e[2]);}}if(!n.get(a)){n.put(a,!0);try{C(a)?(c = cb(a),b = b.concat(g(c.requires)).concat(c._runBlocks),d(c._invokeQueue),d(c._configBlocks)):G(a)?b.push(q.invoke(a)):H(a)?b.push(q.invoke(a)):sb(a,"module");}catch(e) {throw (H(a) && (a = a[a.length - 1]),e.message && e.stack && -1 == e.stack.indexOf(e.message) && (e = e.message + "\n" + e.stack),Fa("modulerr",a,e.stack || e.message || e));}}});return b;}function h(b,c){function d(a,e){if(b.hasOwnProperty(a)){if(b[a] === l)throw Fa("cdep",a + " <- " + k.join(" <- "));return b[a];}try{return (k.unshift(a),b[a] = l,b[a] = c(a,e));}catch(f) {throw (b[a] === l && delete b[a],f);}finally {k.shift();}}function e(b,c,f,g){"string" === typeof f && (g = f,f = null);var k=[],h=ab.$$annotate(b,a,g),l,q,p;q = 0;for(l = h.length;q < l;q++) {p = h[q];if("string" !== typeof p)throw Fa("itkn",p);k.push(f && f.hasOwnProperty(p)?f[p]:d(p,g));}H(b) && (b = b[l]);return b.apply(c,k);}return {invoke:e,instantiate:function instantiate(a,b,c){var d=Object.create((H(a)?a[a.length - 1]:a).prototype || null);a = e(a,d,b,c);return J(a) || G(a)?a:d;},get:d,annotate:ab.$$annotate,has:function has(a){return p.hasOwnProperty(a + "Provider") || b.hasOwnProperty(a);}};}a = !0 === a;var l={},k=[],n=new eb([],!0),p={$provide:{provider:c(d),factory:c(f),service:c(function(a,b){return f(a,["$injector",function(a){return a.instantiate(b);}]);}),value:c(function(a,b){return f(a,ea(b),!1);}),constant:c(function(a,b){La(a,"constant");p[a] = b;u[a] = b;}),decorator:function decorator(a,b){var c=q.get(a + "Provider"),d=c.$get;c.$get = function(){var a=s.invoke(d,c);return s.invoke(b,null,{$delegate:a});};}}},q=p.$injector = h(p,function(a,b){ca.isString(b) && k.push(b);throw Fa("unpr",k.join(" <- "));}),u={},s=u.$injector = h(u,function(a,b){var c=q.get(a + "Provider",b);return s.invoke(c.$get,c,t,a);});r(g(b),function(a){s.invoke(a || E);});return s;}function Be(){var b=!0;this.disableAutoScrolling = function(){b = !1;};this.$get = ["$window","$location","$rootScope",function(a,c,d){function e(a){var b=null;Array.prototype.some.call(a,function(a){if("a" === va(a))return (b = a,!0);});return b;}function f(b){if(b){b.scrollIntoView();var c;c = g.yOffset;G(c)?c = c():oc(c)?(c = c[0],c = "fixed" !== a.getComputedStyle(c).position?0:c.getBoundingClientRect().bottom):Y(c) || (c = 0);c && (b = b.getBoundingClientRect().top,a.scrollBy(0,b - c));}else a.scrollTo(0,0);}function g(){var a=c.hash(),b;a?(b = h.getElementById(a))?f(b):(b = e(h.getElementsByName(a)))?f(b):"top" === a && f(null):f(null);}var h=a.document;b && d.$watch(function(){return c.hash();},function(a,b){a === b && "" === a || jf(function(){d.$evalAsync(g);});});return g;}];}function af(){this.$get = ["$$rAF","$timeout",function(b,a){return b.supported?function(a){return b(a);}:function(b){return a(b,0,!1);};}];}function nf(b,a,c,d){function e(a){try{a.apply(null,Za.call(arguments,1));}finally {if((m--,0 === m))for(;F.length;) try{F.pop()();}catch(b) {c.error(b);}}}function f(a,b){(function da(){r(Z,function(a){a();});L = b(da,a);})();}function g(){h();l();}function h(){a: {try{B = u.state;break a;}catch(a) {}B = void 0;}B = x(B)?null:B;ha(B,O) && (B = O);O = B;}function l(){if(D !== n.url() || I !== B)D = n.url(),I = B,r(X,function(a){a(n.url(),B);});}function k(a){try{return decodeURIComponent(a);}catch(b) {return a;}}var n=this,p=a[0],q=b.location,u=b.history,s=b.setTimeout,M=b.clearTimeout,v={};n.isMock = !1;var m=0,F=[];n.$$completeOutstandingRequest = e;n.$$incOutstandingRequestCount = function(){m++;};n.notifyWhenNoOutstandingRequests = function(a){r(Z,function(a){a();});0 === m?a():F.push(a);};var Z=[],L;n.addPollFn = function(a){x(L) && f(100,s);Z.push(a);return a;};var B,I,D=q.href,S=a.find("base"),P=null;h();I = B;n.url = function(a,c,e){x(e) && (e = null);q !== b.location && (q = b.location);u !== b.history && (u = b.history);if(a){var f=I === e;if(D === a && (!d.history || f))return n;var g=D && Ga(D) === Ga(a);D = a;I = e;!d.history || g && f?(g || (P = a),c?q.replace(a):g?(c = q,e = a.indexOf("#"),a = -1 === e?"":a.substr(e + 1),c.hash = a):q.href = a):(u[c?"replaceState":"pushState"](e,"",a),h(),I = B);return n;}return P || q.href.replace(/%27/g,"'");};n.state = function(){return B;};var X=[],ba=!1,O=null;n.onUrlChange = function(a){if(!ba){if(d.history)A(b).on("popstate",g);A(b).on("hashchange",g);ba = !0;}X.push(a);return a;};n.$$checkUrlChange = l;n.baseHref = function(){var a=S.attr("href");return a?a.replace(/^(https?\:)?\/\/[^\/]*/,""):"";};var fa={},y="",ka=n.baseHref();n.cookies = function(a,b){var d,e,f,g;if(a)b === t?p.cookie = encodeURIComponent(a) + "=;path=" + ka + ";expires=Thu, 01 Jan 1970 00:00:00 GMT":C(b) && (d = (p.cookie = encodeURIComponent(a) + "=" + encodeURIComponent(b) + ";path=" + ka).length + 1,4096 < d && c.warn("Cookie '" + a + "' possibly not set or overflowed because it was too large (" + d + " > 4096 bytes)!"));else {if(p.cookie !== y)for(y = p.cookie,d = y.split("; "),fa = {},f = 0;f < d.length;f++) e = d[f],g = e.indexOf("="),0 < g && (a = k(e.substring(0,g)),fa[a] === t && (fa[a] = k(e.substring(g + 1))));return fa;}};n.defer = function(a,b){var c;m++;c = s(function(){delete v[c];e(a);},b || 0);v[c] = !0;return c;};n.defer.cancel = function(a){return v[a]?(delete v[a],M(a),e(E),!0):!1;};}function De(){this.$get = ["$window","$log","$sniffer","$document",function(b,a,c,d){return new nf(b,d,a,c);}];}function Ee(){this.$get = function(){function b(b,d){function e(a){a != p && (q?q == a && (q = a.n):q = a,f(a.n,a.p),f(a,p),p = a,p.n = null);}function f(a,b){a != b && (a && (a.p = b),b && (b.n = a));}if(b in a)throw R("$cacheFactory")("iid",b);var g=0,h=w({},d,{id:b}),l={},k=d && d.capacity || Number.MAX_VALUE,n={},p=null,q=null;return a[b] = {put:function put(a,b){if(k < Number.MAX_VALUE){var c=n[a] || (n[a] = {key:a});e(c);}if(!x(b))return (a in l || g++,l[a] = b,g > k && this.remove(q.key),b);},get:function get(a){if(k < Number.MAX_VALUE){var b=n[a];if(!b)return;e(b);}return l[a];},remove:function remove(a){if(k < Number.MAX_VALUE){var b=n[a];if(!b)return;b == p && (p = b.p);b == q && (q = b.n);f(b.n,b.p);delete n[a];}delete l[a];g--;},removeAll:function removeAll(){l = {};g = 0;n = {};p = q = null;},destroy:function destroy(){n = h = l = null;delete a[b];},info:function info(){return w({},h,{size:g});}};}var a={};b.info = function(){var b={};r(a,function(a,e){b[e] = a.info();});return b;};b.get = function(b){return a[b];};return b;};}function Ve(){this.$get = ["$cacheFactory",function(b){return b("templates");}];}function yc(b,a){function c(a,b){var c=/^\s*([@&]|=(\*?))(\??)\s*(\w*)\s*$/,d={};r(a,function(a,e){var f=a.match(c);if(!f)throw la("iscp",b,e,a);d[e] = {mode:f[1][0],collection:"*" === f[2],optional:"?" === f[3],attrName:f[4] || e};});return d;}var d={},e=/^\s*directive\:\s*([\w\-]+)\s+(.*)$/,f=/(([\w\-]+)(?:\:([^;]+))?;?)/,g=Gd("ngSrc,ngSrcset,src,srcset"),h=/^(?:(\^\^?)?(\?)?(\^\^?)?)?/,l=/^(on[a-z]+|formaction)$/;this.directive = function p(a,e){La(a,"directive");C(a)?(Rb(e,"directiveFactory"),d.hasOwnProperty(a) || (d[a] = [],b.factory(a + "Directive",["$injector","$exceptionHandler",function(b,e){var f=[];r(d[a],function(d,g){try{var h=b.invoke(d);G(h)?h = {compile:ea(h)}:!h.compile && h.link && (h.compile = ea(h.link));h.priority = h.priority || 0;h.index = g;h.name = h.name || a;h.require = h.require || h.controller && h.name;h.restrict = h.restrict || "EA";J(h.scope) && (h.$$isolateBindings = c(h.scope,h.name));f.push(h);}catch(k) {e(k);}});return f;}])),d[a].push(e)):r(a,mc(p));return this;};this.aHrefSanitizationWhitelist = function(b){return y(b)?(a.aHrefSanitizationWhitelist(b),this):a.aHrefSanitizationWhitelist();};this.imgSrcSanitizationWhitelist = function(b){return y(b)?(a.imgSrcSanitizationWhitelist(b),this):a.imgSrcSanitizationWhitelist();};var k=!0;this.debugInfoEnabled = function(a){return y(a)?(k = a,this):k;};this.$get = ["$injector","$interpolate","$exceptionHandler","$templateRequest","$parse","$controller","$rootScope","$document","$sce","$animate","$$sanitizeUri",function(a,b,c,s,M,v,m,F,Z,L,B){function I(a,b){try{a.addClass(b);}catch(c) {}}function D(a,b,c,d,e){a instanceof A || (a = A(a));r(a,function(b,c){b.nodeType == pb && b.nodeValue.match(/\S+/) && (a[c] = A(b).wrap("<span></span>").parent()[0]);});var f=S(a,b,a,c,d,e);D.$$addScopeClass(a);var g=null;return function(b,c,d){Rb(b,"scope");d = d || {};var e=d.parentBoundTranscludeFn,h=d.transcludeControllers;d = d.futureParentElement;e && e.$$boundTransclude && (e = e.$$boundTransclude);g || (g = (d = d && d[0])?"foreignobject" !== va(d) && d.toString().match(/SVG/)?"svg":"html":"html");d = "html" !== g?A(Xb(g,A("<div>").append(a).html())):c?Ka.clone.call(a):a;if(h)for(var k in h) d.data("$" + k + "Controller",h[k].instance);D.$$addScopeInfo(d,b);c && c(d,b);f && f(b,d,d,e);return d;};}function S(a,b,c,d,e,f){function g(a,c,d,e){var f,k,l,q,p,s,M;if(m)for(M = Array(c.length),q = 0;q < h.length;q += 3) f = h[q],M[f] = c[f];else M = c;q = 0;for(p = h.length;q < p;) k = M[h[q++]],c = h[q++],f = h[q++],c?(c.scope?(l = a.$new(),D.$$addScopeInfo(A(k),l)):l = a,s = c.transcludeOnThisElement?P(a,c.transclude,e,c.elementTranscludeOnThisElement):!c.templateOnThisElement && e?e:!e && b?P(a,b):null,c(f,l,k,d,s)):f && f(a,k.childNodes,t,e);}for(var h=[],k,l,q,p,m,s=0;s < a.length;s++) {k = new Yb();l = X(a[s],[],k,0 === s?d:t,e);(f = l.length?fa(l,a[s],k,b,c,null,[],[],f):null) && f.scope && D.$$addScopeClass(k.$$element);k = f && f.terminal || !(q = a[s].childNodes) || !q.length?null:S(q,f?(f.transcludeOnThisElement || !f.templateOnThisElement) && f.transclude:b);if(f || k)h.push(s,f,k),p = !0,m = m || f;f = null;}return p?g:null;}function P(a,b,c,d){return function(d,e,f,g,h){d || (d = a.$new(!1,h),d.$$transcluded = !0);return b(d,e,{parentBoundTranscludeFn:c,transcludeControllers:f,futureParentElement:g});};}function X(a,b,c,d,g){var h=c.$attr,k;switch(a.nodeType){case qa:ka(b,xa(va(a)),"E",d,g);for(var l,q,p,m=a.attributes,s=0,M=m && m.length;s < M;s++) {var u=!1,L=!1;l = m[s];k = l.name;q = N(l.value);l = xa(k);if(p = U.test(l))k = k.replace(Sc,"").substr(8).replace(/_(.)/g,function(a,b){return b.toUpperCase();});var B=l.replace(/(Start|End)$/,"");x(B) && l === B + "Start" && (u = k,L = k.substr(0,k.length - 5) + "end",k = k.substr(0,k.length - 6));l = xa(k.toLowerCase());h[l] = k;if(p || !c.hasOwnProperty(l))c[l] = q,Nc(a,l) && (c[l] = !0);Oa(a,b,q,l,p);ka(b,l,"A",d,g,u,L);}a = a.className;J(a) && (a = a.animVal);if(C(a) && "" !== a)for(;k = f.exec(a);) l = xa(k[2]),ka(b,l,"C",d,g) && (c[l] = N(k[3])),a = a.substr(k.index + k[0].length);break;case pb:za(b,a.nodeValue);break;case 8:try{if(k = e.exec(a.nodeValue))l = xa(k[1]),ka(b,l,"M",d,g) && (c[l] = N(k[2]));}catch(v) {}}b.sort(da);return b;}function ba(a,b,c){var d=[],e=0;if(b && a.hasAttribute && a.hasAttribute(b)){do {if(!a)throw la("uterdir",b,c);a.nodeType == qa && (a.hasAttribute(b) && e++,a.hasAttribute(c) && e--);d.push(a);a = a.nextSibling;}while(0 < e);}else d.push(a);return A(d);}function O(a,b,c){return function(d,e,f,g,h){e = ba(e[0],b,c);return a(d,e,f,g,h);};}function fa(a,d,e,f,g,k,l,p,m){function s(a,b,c,d){if(a){c && (a = O(a,c,d));a.require = K.require;a.directiveName = da;if(P === K || K.$$isolateScope)a = Y(a,{isolateScope:!0});l.push(a);}if(b){c && (b = O(b,c,d));b.require = K.require;b.directiveName = da;if(P === K || K.$$isolateScope)b = Y(b,{isolateScope:!0});p.push(b);}}function L(a,b,c,d){var e,f="data",g=!1,k=c,l;if(C(b)){l = b.match(h);b = b.substring(l[0].length);l[3] && (l[1]?l[3] = null:l[1] = l[3]);"^" === l[1]?f = "inheritedData":"^^" === l[1] && (f = "inheritedData",k = c.parent());"?" === l[2] && (g = !0);e = null;d && "data" === f && (e = d[b]) && (e = e.instance);e = e || k[f]("$" + b + "Controller");if(!e && !g)throw la("ctreq",b,a);return e || null;}H(b) && (e = [],r(b,function(b){e.push(L(a,b,c,d));}));return e;}function B(a,c,f,g,h){function k(a,b,c){var d;Va(a) || (c = b,b = a,a = t);E && (d = F);c || (c = E?X.parent():X);return h(a,b,d,c,Wb);}var m,s,u,I,F,gb,X,O;d === f?(O = e,X = e.$$element):(X = A(f),O = new Yb(X,e));P && (I = c.$new(!0));h && (gb = k,gb.$$boundTransclude = h);S && (Z = {},F = {},r(S,function(a){var b={$scope:a === P || a.$$isolateScope?I:c,$element:X,$attrs:O,$transclude:gb};u = a.controller;"@" == u && (u = O[a.name]);b = v(u,b,!0,a.controllerAs);F[a.name] = b;E || X.data("$" + a.name + "Controller",b.instance);Z[a.name] = b;}));if(P){D.$$addScopeInfo(X,I,!0,!(ma && (ma === P || ma === P.$$originalDirective)));D.$$addScopeClass(X,!0);g = Z && Z[P.name];var ba=I;g && g.identifier && !0 === P.bindToController && (ba = g.instance);r(I.$$isolateBindings = P.$$isolateBindings,function(a,d){var e=a.attrName,f=a.optional,g,h,k,l;switch(a.mode){case "@":O.$observe(e,function(a){ba[d] = a;});O.$$observers[e].$$scope = c;O[e] && (ba[d] = b(O[e])(c));break;case "=":if(f && !O[e])break;h = M(O[e]);l = h.literal?ha:function(a,b){return a === b || a !== a && b !== b;};k = h.assign || function(){g = ba[d] = h(c);throw la("nonassign",O[e],P.name);};g = ba[d] = h(c);f = function(a){l(a,ba[d]) || (l(a,g)?k(c,a = ba[d]):ba[d] = a);return g = a;};f.$stateful = !0;f = a.collection?c.$watchCollection(O[e],f):c.$watch(M(O[e],f),null,h.literal);I.$on("$destroy",f);break;case "&":h = M(O[e]),ba[d] = function(a){return h(c,a);};}});}Z && (r(Z,function(a){a();}),Z = null);g = 0;for(m = l.length;g < m;g++) s = l[g],$(s,s.isolateScope?I:c,X,O,s.require && L(s.directiveName,s.require,X,F),gb);var Wb=c;P && (P.template || null === P.templateUrl) && (Wb = I);a && a(Wb,f.childNodes,t,h);for(g = p.length - 1;0 <= g;g--) s = p[g],$(s,s.isolateScope?I:c,X,O,s.require && L(s.directiveName,s.require,X,F),gb);}m = m || {};for(var I=-Number.MAX_VALUE,F,S=m.controllerDirectives,Z,P=m.newIsolateScopeDirective,ma=m.templateDirective,fa=m.nonTlbTranscludeDirective,ka=!1,x=!1,E=m.hasElementTranscludeDirective,w=e.$$element = A(d),K,da,V,fb=f,za,z=0,Q=a.length;z < Q;z++) {K = a[z];var Oa=K.$$start,U=K.$$end;Oa && (w = ba(d,Oa,U));V = t;if(I > K.priority)break;if(V = K.scope)K.templateUrl || (J(V)?(Na("new/isolated scope",P || F,K,w),P = K):Na("new/isolated scope",P,K,w)),F = F || K;da = K.name;!K.templateUrl && K.controller && (V = K.controller,S = S || {},Na("'" + da + "' controller",S[da],K,w),S[da] = K);if(V = K.transclude)ka = !0,K.$$tlb || (Na("transclusion",fa,K,w),fa = K),"element" == V?(E = !0,I = K.priority,V = w,w = e.$$element = A(W.createComment(" " + da + ": " + e[da] + " ")),d = w[0],T(g,Za.call(V,0),d),fb = D(V,f,I,k && k.name,{nonTlbTranscludeDirective:fa})):(V = A(Ub(d)).contents(),w.empty(),fb = D(V,f));if(K.template)if((x = !0,Na("template",ma,K,w),ma = K,V = G(K.template)?K.template(w,e):K.template,V = Tc(V),K.replace)){k = K;V = Sb.test(V)?Uc(Xb(K.templateNamespace,N(V))):[];d = V[0];if(1 != V.length || d.nodeType !== qa)throw la("tplrt",da,"");T(g,w,d);Q = {$attr:{}};V = X(d,[],Q);var aa=a.splice(z + 1,a.length - (z + 1));P && y(V);a = a.concat(V).concat(aa);R(e,Q);Q = a.length;}else w.html(V);if(K.templateUrl)x = !0,Na("template",ma,K,w),ma = K,K.replace && (k = K),B = of(a.splice(z,a.length - z),w,e,g,ka && fb,l,p,{controllerDirectives:S,newIsolateScopeDirective:P,templateDirective:ma,nonTlbTranscludeDirective:fa}),Q = a.length;else if(K.compile)try{za = K.compile(w,e,fb),G(za)?s(null,za,Oa,U):za && s(za.pre,za.post,Oa,U);}catch(pf) {c(pf,wa(w));}K.terminal && (B.terminal = !0,I = Math.max(I,K.priority));}B.scope = F && !0 === F.scope;B.transcludeOnThisElement = ka;B.elementTranscludeOnThisElement = E;B.templateOnThisElement = x;B.transclude = fb;m.hasElementTranscludeDirective = E;return B;}function y(a){for(var b=0,c=a.length;b < c;b++) a[b] = Ob(a[b],{$$isolateScope:!0});}function ka(b,e,f,g,h,k,l){if(e === h)return null;h = null;if(d.hasOwnProperty(e)){var q;e = a.get(e + "Directive");for(var m=0,s=e.length;m < s;m++) try{q = e[m],(g === t || g > q.priority) && -1 != q.restrict.indexOf(f) && (k && (q = Ob(q,{$$start:k,$$end:l})),b.push(q),h = q);}catch(M) {c(M);}}return h;}function x(b){if(d.hasOwnProperty(b))for(var c=a.get(b + "Directive"),e=0,f=c.length;e < f;e++) if((b = c[e],b.multiElement))return !0;return !1;}function R(a,b){var c=b.$attr,d=a.$attr,e=a.$$element;r(a,function(d,e){"$" != e.charAt(0) && (b[e] && b[e] !== d && (d += ("style" === e?";":" ") + b[e]),a.$set(e,d,!0,c[e]));});r(b,function(b,f){"class" == f?(I(e,b),a["class"] = (a["class"]?a["class"] + " ":"") + b):"style" == f?(e.attr("style",e.attr("style") + ";" + b),a.style = (a.style?a.style + ";":"") + b):"$" == f.charAt(0) || a.hasOwnProperty(f) || (a[f] = b,d[f] = c[f]);});}function of(a,b,c,d,e,f,g,h){var k=[],l,q,p=b[0],m=a.shift(),M=Ob(m,{templateUrl:null,transclude:null,replace:null,$$originalDirective:m}),u=G(m.templateUrl)?m.templateUrl(b,c):m.templateUrl,L=m.templateNamespace;b.empty();s(Z.getTrustedResourceUrl(u)).then(function(s){var B,v;s = Tc(s);if(m.replace){s = Sb.test(s)?Uc(Xb(L,N(s))):[];B = s[0];if(1 != s.length || B.nodeType !== qa)throw la("tplrt",m.name,u);s = {$attr:{}};T(d,b,B);var D=X(B,[],s);J(m.scope) && y(D);a = D.concat(a);R(c,s);}else B = p,b.html(s);a.unshift(M);l = fa(a,B,c,e,b,m,f,g,h);r(d,function(a,c){a == B && (d[c] = b[0]);});for(q = S(b[0].childNodes,e);k.length;) {s = k.shift();v = k.shift();var F=k.shift(),O=k.shift(),D=b[0];if(!s.$$destroyed){if(v !== p){var Z=v.className;h.hasElementTranscludeDirective && m.replace || (D = Ub(B));T(F,A(v),D);I(A(D),Z);}v = l.transcludeOnThisElement?P(s,l.transclude,O):O;l(q,s,D,d,v);}}k = null;});return function(a,b,c,d,e){a = e;b.$$destroyed || (k?k.push(b,c,d,a):(l.transcludeOnThisElement && (a = P(b,l.transclude,e)),l(q,b,c,d,a)));};}function da(a,b){var c=b.priority - a.priority;return 0 !== c?c:a.name !== b.name?a.name < b.name?-1:1:a.index - b.index;}function Na(a,b,c,d){if(b)throw la("multidir",b.name,c.name,a,wa(d));}function za(a,c){var d=b(c,!0);d && a.push({priority:0,compile:function compile(a){a = a.parent();var b=!!a.length;b && D.$$addBindingClass(a);return function(a,c){var e=c.parent();b || D.$$addBindingClass(e);D.$$addBindingInfo(e,d.expressions);a.$watch(d,function(a){c[0].nodeValue = a;});};}});}function Xb(a,b){a = z(a || "html");switch(a){case "svg":case "math":var c=W.createElement("div");c.innerHTML = "<" + a + ">" + b + "</" + a + ">";return c.childNodes[0].childNodes;default:return b;}}function Q(a,b){if("srcdoc" == b)return Z.HTML;var c=va(a);if("xlinkHref" == b || "form" == c && "action" == b || "img" != c && ("src" == b || "ngSrc" == b))return Z.RESOURCE_URL;}function Oa(a,c,d,e,f){var h=Q(a,e);f = g[e] || f;var k=b(d,!0,h,f);if(k){if("multiple" === e && "select" === va(a))throw la("selmulti",wa(a));c.push({priority:100,compile:function compile(){return {pre:function pre(a,c,g){c = g.$$observers || (g.$$observers = {});if(l.test(e))throw la("nodomevents");var m=g[e];m !== d && (k = m && b(m,!0,h,f),d = m);k && (g[e] = k(a),(c[e] || (c[e] = [])).$$inter = !0,(g.$$observers && g.$$observers[e].$$scope || a).$watch(k,function(a,b){"class" === e && a != b?g.$updateClass(a,b):g.$set(e,a);}));}};}});}}function T(a,b,c){var d=b[0],e=b.length,f=d.parentNode,g,h;if(a)for(g = 0,h = a.length;g < h;g++) if(a[g] == d){a[g++] = c;h = g + e - 1;for(var k=a.length;g < k;g++,h++) h < k?a[g] = a[h]:delete a[g];a.length -= e - 1;a.context === d && (a.context = c);break;}f && f.replaceChild(c,d);a = W.createDocumentFragment();a.appendChild(d);A(c).data(A(d).data());ta?(Qb = !0,ta.cleanData([d])):delete A.cache[d[A.expando]];d = 1;for(e = b.length;d < e;d++) f = b[d],A(f).remove(),a.appendChild(f),delete b[d];b[0] = c;b.length = 1;}function Y(a,b){return w(function(){return a.apply(null,arguments);},a,b);}function $(a,b,d,e,f,g){try{a(b,d,e,f,g);}catch(h) {c(h,wa(d));}}var Yb=function Yb(a,b){if(b){var c=Object.keys(b),d,e,f;d = 0;for(e = c.length;d < e;d++) f = c[d],this[f] = b[f];}else this.$attr = {};this.$$element = a;};Yb.prototype = {$normalize:xa,$addClass:function $addClass(a){a && 0 < a.length && L.addClass(this.$$element,a);},$removeClass:function $removeClass(a){a && 0 < a.length && L.removeClass(this.$$element,a);},$updateClass:function $updateClass(a,b){var c=Vc(a,b);c && c.length && L.addClass(this.$$element,c);(c = Vc(b,a)) && c.length && L.removeClass(this.$$element,c);},$set:function $set(a,b,d,e){var f=this.$$element[0],g=Nc(f,a),h=kf(f,a),f=a;g?(this.$$element.prop(a,b),e = g):h && (this[h] = b,f = h);this[a] = b;e?this.$attr[a] = e:(e = this.$attr[a]) || (this.$attr[a] = e = vc(a,"-"));g = va(this.$$element);if("a" === g && "href" === a || "img" === g && "src" === a)this[a] = b = B(b,"src" === a);else if("img" === g && "srcset" === a){for(var g="",h=N(b),k=/(\s+\d+x\s*,|\s+\d+w\s*,|\s+,|,\s+)/,k=/\s/.test(h)?k:/(,)/,h=h.split(k),k=Math.floor(h.length / 2),l=0;l < k;l++) var q=2 * l,g=g + B(N(h[q]),!0),g=g + (" " + N(h[q + 1]));h = N(h[2 * l]).split(/\s/);g += B(N(h[0]),!0);2 === h.length && (g += " " + N(h[1]));this[a] = b = g;}!1 !== d && (null === b || b === t?this.$$element.removeAttr(e):this.$$element.attr(e,b));(a = this.$$observers) && r(a[f],function(a){try{a(b);}catch(d) {c(d);}});},$observe:function $observe(a,b){var c=this,d=c.$$observers || (c.$$observers = ia()),e=d[a] || (d[a] = []);e.push(b);m.$evalAsync(function(){!e.$$inter && c.hasOwnProperty(a) && b(c[a]);});return function(){Xa(e,b);};}};var V=b.startSymbol(),ma=b.endSymbol(),Tc="{{" == V || "}}" == ma?ra:function(a){return a.replace(/\{\{/g,V).replace(/}}/g,ma);},U=/^ngAttr[A-Z]/;D.$$addBindingInfo = k?function(a,b){var c=a.data("$binding") || [];H(b)?c = c.concat(b):c.push(b);a.data("$binding",c);}:E;D.$$addBindingClass = k?function(a){I(a,"ng-binding");}:E;D.$$addScopeInfo = k?function(a,b,c,d){a.data(c?d?"$isolateScopeNoTemplate":"$isolateScope":"$scope",b);}:E;D.$$addScopeClass = k?function(a,b){I(a,b?"ng-isolate-scope":"ng-scope");}:E;return D;}];}function xa(b){return db(b.replace(Sc,""));}function Vc(b,a){var c="",d=b.split(/\s+/),e=a.split(/\s+/),f=0;a: for(;f < d.length;f++) {for(var g=d[f],h=0;h < e.length;h++) if(g == e[h])continue a;c += (0 < c.length?" ":"") + g;}return c;}function Uc(b){b = A(b);var a=b.length;if(1 >= a)return b;for(;a--;) 8 === b[a].nodeType && qf.call(b,a,1);return b;}function Fe(){var b={},a=!1,c=/^(\S+)(\s+as\s+(\w+))?$/;this.register = function(a,c){La(a,"controller");J(a)?w(b,a):b[a] = c;};this.allowGlobals = function(){a = !0;};this.$get = ["$injector","$window",function(d,e){function f(a,b,c,d){if(!a || !J(a.$scope))throw R("$controller")("noscp",d,b);a.$scope[b] = c;}return function(g,h,l,k){var n,p,q;l = !0 === l;k && C(k) && (q = k);if(C(g)){k = g.match(c);if(!k)throw rf("ctrlfmt",g);p = k[1];q = q || k[3];g = b.hasOwnProperty(p)?b[p]:xc(h.$scope,p,!0) || (a?xc(e,p,!0):t);sb(g,p,!0);}if(l)return (l = (H(g)?g[g.length - 1]:g).prototype,n = Object.create(l || null),q && f(h,q,n,p || g.name),w(function(){d.invoke(g,n,h,p);return n;},{instance:n,identifier:q}));n = d.instantiate(g,h,p);q && f(h,q,n,p || g.name);return n;};}];}function Ge(){this.$get = ["$window",function(b){return A(b.document);}];}function He(){this.$get = ["$log",function(b){return function(a,c){b.error.apply(b,arguments);};}];}function Zb(b,a){if(C(b)){var c=b.replace(sf,"").trim();if(c){var d=a("Content-Type");(d = d && 0 === d.indexOf(Wc)) || (d = (d = c.match(tf)) && uf[d[0]].test(c));d && (b = qc(c));}}return b;}function Xc(b){var a=ia(),c,d,e;if(!b)return a;r(b.split("\n"),function(b){e = b.indexOf(":");c = z(N(b.substr(0,e)));d = N(b.substr(e + 1));c && (a[c] = a[c]?a[c] + ", " + d:d);});return a;}function Yc(b){var a=J(b)?b:t;return function(c){a || (a = Xc(b));return c?(c = a[z(c)],void 0 === c && (c = null),c):a;};}function Zc(b,a,c,d){if(G(d))return d(b,a,c);r(d,function(d){b = d(b,a,c);});return b;}function Ke(){var b=this.defaults = {transformResponse:[Zb],transformRequest:[function(a){return J(a) && "[object File]" !== Ca.call(a) && "[object Blob]" !== Ca.call(a) && "[object FormData]" !== Ca.call(a)?$a(a):a;}],headers:{common:{Accept:"application/json, text/plain, */*"},post:sa($b),put:sa($b),patch:sa($b)},xsrfCookieName:"XSRF-TOKEN",xsrfHeaderName:"X-XSRF-TOKEN"},a=!1;this.useApplyAsync = function(b){return y(b)?(a = !!b,this):a;};var c=this.interceptors = [];this.$get = ["$httpBackend","$browser","$cacheFactory","$rootScope","$q","$injector",function(d,e,f,g,h,l){function k(a){function c(a){var b=w({},a);b.data = a.data?Zc(a.data,a.headers,a.status,e.transformResponse):a.data;a = a.status;return 200 <= a && 300 > a?b:h.reject(b);}function d(a){var b,c={};r(a,function(a,d){G(a)?(b = a(),null != b && (c[d] = b)):c[d] = a;});return c;}if(!ca.isObject(a))throw R("$http")("badreq",a);var e=w({method:"get",transformRequest:b.transformRequest,transformResponse:b.transformResponse},a);e.headers = (function(a){var c=b.headers,e=w({},a.headers),f,g,c=w({},c.common,c[z(a.method)]);a: for(f in c) {a = z(f);for(g in e) if(z(g) === a)continue a;e[f] = c[f];}return d(e);})(a);e.method = ub(e.method);var f=[function(a){var d=a.headers,e=Zc(a.data,Yc(d),t,a.transformRequest);x(e) && r(d,function(a,b){"content-type" === z(b) && delete d[b];});x(a.withCredentials) && !x(b.withCredentials) && (a.withCredentials = b.withCredentials);return n(a,e).then(c,c);},t],g=h.when(e);for(r(u,function(a){(a.request || a.requestError) && f.unshift(a.request,a.requestError);(a.response || a.responseError) && f.push(a.response,a.responseError);});f.length;) {a = f.shift();var k=f.shift(),g=g.then(a,k);}g.success = function(a){g.then(function(b){a(b.data,b.status,b.headers,e);});return g;};g.error = function(a){g.then(null,function(b){a(b.data,b.status,b.headers,e);});return g;};return g;}function n(c,f){function l(b,c,d,e){function f(){m(c,b,d,e);}I && (200 <= b && 300 > b?I.put(P,[b,c,Xc(d),e]):I.remove(P));a?g.$applyAsync(f):(f(),g.$$phase || g.$apply());}function m(a,b,d,e){b = Math.max(b,0);(200 <= b && 300 > b?L.resolve:L.reject)({data:a,status:b,headers:Yc(d),config:c,statusText:e});}function n(a){m(a.data,a.status,sa(a.headers()),a.statusText);}function u(){var a=k.pendingRequests.indexOf(c);-1 !== a && k.pendingRequests.splice(a,1);}var L=h.defer(),B=L.promise,I,D,S=c.headers,P=p(c.url,c.params);k.pendingRequests.push(c);B.then(u,u);!c.cache && !b.cache || !1 === c.cache || "GET" !== c.method && "JSONP" !== c.method || (I = J(c.cache)?c.cache:J(b.cache)?b.cache:q);I && (D = I.get(P),y(D)?D && G(D.then)?D.then(n,n):H(D)?m(D[1],D[0],sa(D[2]),D[3]):m(D,200,{},"OK"):I.put(P,B));x(D) && ((D = $c(c.url)?e.cookies()[c.xsrfCookieName || b.xsrfCookieName]:t) && (S[c.xsrfHeaderName || b.xsrfHeaderName] = D),d(c.method,P,f,l,S,c.timeout,c.withCredentials,c.responseType));return B;}function p(a,b){if(!b)return a;var c=[];Ed(b,function(a,b){null === a || x(a) || (H(a) || (a = [a]),r(a,function(a){J(a) && (a = ga(a)?a.toISOString():$a(a));c.push(Ea(b) + "=" + Ea(a));}));});0 < c.length && (a += (-1 == a.indexOf("?")?"?":"&") + c.join("&"));return a;}var q=f("$http"),u=[];r(c,function(a){u.unshift(C(a)?l.get(a):l.invoke(a));});k.pendingRequests = [];(function(a){r(arguments,function(a){k[a] = function(b,c){return k(w(c || {},{method:a,url:b}));};});})("get","delete","head","jsonp");(function(a){r(arguments,function(a){k[a] = function(b,c,d){return k(w(d || {},{method:a,url:b,data:c}));};});})("post","put","patch");k.defaults = b;return k;}];}function vf(){return new Q.XMLHttpRequest();}function Le(){this.$get = ["$browser","$window","$document",function(b,a,c){return wf(b,vf,b.defer,a.angular.callbacks,c[0]);}];}function wf(b,a,c,d,e){function f(a,b,c){var f=e.createElement("script"),n=null;f.type = "text/javascript";f.src = a;f.async = !0;n = function(a){f.removeEventListener("load",n,!1);f.removeEventListener("error",n,!1);e.body.removeChild(f);f = null;var g=-1,u="unknown";a && ("load" !== a.type || d[b].called || (a = {type:"error"}),u = a.type,g = "error" === a.type?404:200);c && c(g,u);};f.addEventListener("load",n,!1);f.addEventListener("error",n,!1);e.body.appendChild(f);return n;}return function(e,h,l,k,n,p,q,u){function s(){m && m();F && F.abort();}function M(a,d,e,f,g){L !== t && c.cancel(L);m = F = null;a(d,e,f,g);b.$$completeOutstandingRequest(E);}b.$$incOutstandingRequestCount();h = h || b.url();if("jsonp" == z(e)){var v="_" + (d.counter++).toString(36);d[v] = function(a){d[v].data = a;d[v].called = !0;};var m=f(h.replace("JSON_CALLBACK","angular.callbacks." + v),v,function(a,b){M(k,a,d[v].data,"",b);d[v] = E;});}else {var F=a();F.open(e,h,!0);r(n,function(a,b){y(a) && F.setRequestHeader(b,a);});F.onload = function(){var a=F.statusText || "",b="response" in F?F.response:F.responseText,c=1223 === F.status?204:F.status;0 === c && (c = b?200:"file" == Aa(h).protocol?404:0);M(k,c,b,F.getAllResponseHeaders(),a);};e = function(){M(k,-1,null,null,"");};F.onerror = e;F.onabort = e;q && (F.withCredentials = !0);if(u)try{F.responseType = u;}catch(Z) {if("json" !== u)throw Z;}F.send(l || null);}if(0 < p)var L=c(s,p);else p && G(p.then) && p.then(s);};}function Ie(){var b="{{",a="}}";this.startSymbol = function(a){return a?(b = a,this):b;};this.endSymbol = function(b){return b?(a = b,this):a;};this.$get = ["$parse","$exceptionHandler","$sce",function(c,d,e){function f(a){return "\\\\\\" + a;}function g(f,g,u,s){function M(c){return c.replace(k,b).replace(n,a);}function v(a){try{var b=a;a = u?e.getTrusted(u,b):e.valueOf(b);var c;if(s && !y(a))c = a;else if(null == a)c = "";else {switch(typeof a){case "string":break;case "number":a = "" + a;break;default:a = $a(a);}c = a;}return c;}catch(g) {c = ac("interr",f,g.toString()),d(c);}}s = !!s;for(var m,F,r=0,L=[],B=[],I=f.length,D=[],S=[];r < I;) if(-1 != (m = f.indexOf(b,r)) && -1 != (F = f.indexOf(a,m + h)))r !== m && D.push(M(f.substring(r,m))),r = f.substring(m + h,F),L.push(r),B.push(c(r,v)),r = F + l,S.push(D.length),D.push("");else {r !== I && D.push(M(f.substring(r)));break;}if(u && 1 < D.length)throw ac("noconcat",f);if(!g || L.length){var P=function P(a){for(var b=0,c=L.length;b < c;b++) {if(s && x(a[b]))return;D[S[b]] = a[b];}return D.join("");};return w(function(a){var b=0,c=L.length,e=Array(c);try{for(;b < c;b++) e[b] = B[b](a);return P(e);}catch(g) {a = ac("interr",f,g.toString()),d(a);}},{exp:f,expressions:L,$$watchDelegate:function $$watchDelegate(a,b,c){var d;return a.$watchGroup(B,function(c,e){var f=P(c);G(b) && b.call(this,f,c !== e?d:f,a);d = f;},c);}});}}var h=b.length,l=a.length,k=new RegExp(b.replace(/./g,f),"g"),n=new RegExp(a.replace(/./g,f),"g");g.startSymbol = function(){return b;};g.endSymbol = function(){return a;};return g;}];}function Je(){this.$get = ["$rootScope","$window","$q","$$q",function(b,a,c,d){function e(e,h,l,k){var n=a.setInterval,p=a.clearInterval,q=0,u=y(k) && !k,s=(u?d:c).defer(),M=s.promise;l = y(l)?l:0;M.then(null,null,e);M.$$intervalId = n(function(){s.notify(q++);0 < l && q >= l && (s.resolve(q),p(M.$$intervalId),delete f[M.$$intervalId]);u || b.$apply();},h);f[M.$$intervalId] = s;return M;}var f={};e.cancel = function(b){return b && b.$$intervalId in f?(f[b.$$intervalId].reject("canceled"),a.clearInterval(b.$$intervalId),delete f[b.$$intervalId],!0):!1;};return e;}];}function Rd(){this.$get = function(){return {id:"en-us",NUMBER_FORMATS:{DECIMAL_SEP:".",GROUP_SEP:",",PATTERNS:[{minInt:1,minFrac:0,maxFrac:3,posPre:"",posSuf:"",negPre:"-",negSuf:"",gSize:3,lgSize:3},{minInt:1,minFrac:2,maxFrac:2,posPre:"¤",posSuf:"",negPre:"(¤",negSuf:")",gSize:3,lgSize:3}],CURRENCY_SYM:"$"},DATETIME_FORMATS:{MONTH:"January February March April May June July August September October November December".split(" "),SHORTMONTH:"Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" "),DAY:"Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),SHORTDAY:"Sun Mon Tue Wed Thu Fri Sat".split(" "),AMPMS:["AM","PM"],medium:"MMM d, y h:mm:ss a","short":"M/d/yy h:mm a",fullDate:"EEEE, MMMM d, y",longDate:"MMMM d, y",mediumDate:"MMM d, y",shortDate:"M/d/yy",mediumTime:"h:mm:ss a",shortTime:"h:mm a",ERANAMES:["Before Christ","Anno Domini"],ERAS:["BC","AD"]},pluralCat:function pluralCat(b){return 1 === b?"one":"other";}};};}function bc(b){b = b.split("/");for(var a=b.length;a--;) b[a] = qb(b[a]);return b.join("/");}function ad(b,a){var c=Aa(b);a.$$protocol = c.protocol;a.$$host = c.hostname;a.$$port = aa(c.port) || xf[c.protocol] || null;}function bd(b,a){var c="/" !== b.charAt(0);c && (b = "/" + b);var d=Aa(b);a.$$path = decodeURIComponent(c && "/" === d.pathname.charAt(0)?d.pathname.substring(1):d.pathname);a.$$search = sc(d.search);a.$$hash = decodeURIComponent(d.hash);a.$$path && "/" != a.$$path.charAt(0) && (a.$$path = "/" + a.$$path);}function ya(b,a){if(0 === a.indexOf(b))return a.substr(b.length);}function Ga(b){var a=b.indexOf("#");return -1 == a?b:b.substr(0,a);}function Fb(b){return b.replace(/(#.+)|#$/,"$1");}function cc(b){return b.substr(0,Ga(b).lastIndexOf("/") + 1);}function dc(b,a){this.$$html5 = !0;a = a || "";var c=cc(b);ad(b,this);this.$$parse = function(a){var b=ya(c,a);if(!C(b))throw Gb("ipthprfx",a,c);bd(b,this);this.$$path || (this.$$path = "/");this.$$compose();};this.$$compose = function(){var a=Pb(this.$$search),b=this.$$hash?"#" + qb(this.$$hash):"";this.$$url = bc(this.$$path) + (a?"?" + a:"") + b;this.$$absUrl = c + this.$$url.substr(1);};this.$$parseLinkUrl = function(d,e){if(e && "#" === e[0])return (this.hash(e.slice(1)),!0);var f,g;(f = ya(b,d)) !== t?(g = f,g = (f = ya(a,f)) !== t?c + (ya("/",f) || f):b + g):(f = ya(c,d)) !== t?g = c + f:c == d + "/" && (g = c);g && this.$$parse(g);return !!g;};}function ec(b,a){var c=cc(b);ad(b,this);this.$$parse = function(d){d = ya(b,d) || ya(c,d);var e;"#" === d.charAt(0)?(e = ya(a,d),x(e) && (e = d)):e = this.$$html5?d:"";bd(e,this);d = this.$$path;var f=/^\/[A-Z]:(\/.*)/;0 === e.indexOf(b) && (e = e.replace(b,""));f.exec(e) || (d = (e = f.exec(d))?e[1]:d);this.$$path = d;this.$$compose();};this.$$compose = function(){var c=Pb(this.$$search),e=this.$$hash?"#" + qb(this.$$hash):"";this.$$url = bc(this.$$path) + (c?"?" + c:"") + e;this.$$absUrl = b + (this.$$url?a + this.$$url:"");};this.$$parseLinkUrl = function(a,c){return Ga(b) == Ga(a)?(this.$$parse(a),!0):!1;};}function cd(b,a){this.$$html5 = !0;ec.apply(this,arguments);var c=cc(b);this.$$parseLinkUrl = function(d,e){if(e && "#" === e[0])return (this.hash(e.slice(1)),!0);var f,g;b == Ga(d)?f = d:(g = ya(c,d))?f = b + a + g:c === d + "/" && (f = c);f && this.$$parse(f);return !!f;};this.$$compose = function(){var c=Pb(this.$$search),e=this.$$hash?"#" + qb(this.$$hash):"";this.$$url = bc(this.$$path) + (c?"?" + c:"") + e;this.$$absUrl = b + a + this.$$url;};}function Hb(b){return function(){return this[b];};}function dd(b,a){return function(c){if(x(c))return this[b];this[b] = a(c);this.$$compose();return this;};}function Me(){var b="",a={enabled:!1,requireBase:!0,rewriteLinks:!0};this.hashPrefix = function(a){return y(a)?(b = a,this):b;};this.html5Mode = function(b){return Wa(b)?(a.enabled = b,this):J(b)?(Wa(b.enabled) && (a.enabled = b.enabled),Wa(b.requireBase) && (a.requireBase = b.requireBase),Wa(b.rewriteLinks) && (a.rewriteLinks = b.rewriteLinks),this):a;};this.$get = ["$rootScope","$browser","$sniffer","$rootElement","$window",function(c,d,e,f,g){function h(a,b,c){var e=k.url(),f=k.$$state;try{d.url(a,b,c),k.$$state = d.state();}catch(g) {throw (k.url(e),k.$$state = f,g);}}function l(a,b){c.$broadcast("$locationChangeSuccess",k.absUrl(),a,k.$$state,b);}var k,n;n = d.baseHref();var p=d.url(),q;if(a.enabled){if(!n && a.requireBase)throw Gb("nobase");q = p.substring(0,p.indexOf("/",p.indexOf("//") + 2)) + (n || "/");n = e.history?dc:cd;}else q = Ga(p),n = ec;k = new n(q,"#" + b);k.$$parseLinkUrl(p,p);k.$$state = d.state();var u=/^\s*(javascript|mailto):/i;f.on("click",function(b){if(a.rewriteLinks && !b.ctrlKey && !b.metaKey && !b.shiftKey && 2 != b.which && 2 != b.button){for(var e=A(b.target);"a" !== va(e[0]);) if(e[0] === f[0] || !(e = e.parent())[0])return;var h=e.prop("href"),l=e.attr("href") || e.attr("xlink:href");J(h) && "[object SVGAnimatedString]" === h.toString() && (h = Aa(h.animVal).href);u.test(h) || !h || e.attr("target") || b.isDefaultPrevented() || !k.$$parseLinkUrl(h,l) || (b.preventDefault(),k.absUrl() != d.url() && (c.$apply(),g.angular["ff-684208-preventDefault"] = !0));}});Fb(k.absUrl()) != Fb(p) && d.url(k.absUrl(),!0);var s=!0;d.onUrlChange(function(a,b){c.$evalAsync(function(){var d=k.absUrl(),e=k.$$state,f;k.$$parse(a);k.$$state = b;f = c.$broadcast("$locationChangeStart",a,d,b,e).defaultPrevented;k.absUrl() === a && (f?(k.$$parse(d),k.$$state = e,h(d,!1,e)):(s = !1,l(d,e)));});c.$$phase || c.$digest();});c.$watch(function(){var a=Fb(d.url()),b=Fb(k.absUrl()),f=d.state(),g=k.$$replace,q=a !== b || k.$$html5 && e.history && f !== k.$$state;if(s || q)s = !1,c.$evalAsync(function(){var b=k.absUrl(),d=c.$broadcast("$locationChangeStart",b,a,k.$$state,f).defaultPrevented;k.absUrl() === b && (d?(k.$$parse(a),k.$$state = f):(q && h(b,g,f === k.$$state?null:k.$$state),l(a,f)));});k.$$replace = !1;});return k;}];}function Ne(){var b=!0,a=this;this.debugEnabled = function(a){return y(a)?(b = a,this):b;};this.$get = ["$window",function(c){function d(a){a instanceof Error && (a.stack?a = a.message && -1 === a.stack.indexOf(a.message)?"Error: " + a.message + "\n" + a.stack:a.stack:a.sourceURL && (a = a.message + "\n" + a.sourceURL + ":" + a.line));return a;}function e(a){var b=c.console || {},e=b[a] || b.log || E;a = !1;try{a = !!e.apply;}catch(l) {}return a?function(){var a=[];r(arguments,function(b){a.push(d(b));});return e.apply(b,a);}:function(a,b){e(a,null == b?"":b);};}return {log:e("log"),info:e("info"),warn:e("warn"),error:e("error"),debug:(function(){var c=e("debug");return function(){b && c.apply(a,arguments);};})()};}];}function ua(b,a){if("__defineGetter__" === b || "__defineSetter__" === b || "__lookupGetter__" === b || "__lookupSetter__" === b || "__proto__" === b)throw na("isecfld",a);return b;}function oa(b,a){if(b){if(b.constructor === b)throw na("isecfn",a);if(b.window === b)throw na("isecwindow",a);if(b.children && (b.nodeName || b.prop && b.attr && b.find))throw na("isecdom",a);if(b === Object)throw na("isecobj",a);}return b;}function fc(b){return b.constant;}function hb(b,a,c,d,e){oa(b,e);oa(a,e);c = c.split(".");for(var f,g=0;1 < c.length;g++) {f = ua(c.shift(),e);var h=0 === g && a && a[f] || b[f];h || (h = {},b[f] = h);b = oa(h,e);}f = ua(c.shift(),e);oa(b[f],e);return b[f] = d;}function Pa(b){return "constructor" == b;}function ed(b,a,c,d,e,f,g){ua(b,f);ua(a,f);ua(c,f);ua(d,f);ua(e,f);var h=function h(a){return oa(a,f);},l=g || Pa(b)?h:ra,k=g || Pa(a)?h:ra,n=g || Pa(c)?h:ra,p=g || Pa(d)?h:ra,q=g || Pa(e)?h:ra;return function(f,g){var h=g && g.hasOwnProperty(b)?g:f;if(null == h)return h;h = l(h[b]);if(!a)return h;if(null == h)return t;h = k(h[a]);if(!c)return h;if(null == h)return t;h = n(h[c]);if(!d)return h;if(null == h)return t;h = p(h[d]);return e?null == h?t:h = q(h[e]):h;};}function yf(b,a){return function(c,d){return b(c,d,oa,a);};}function zf(b,a,c){var d=a.expensiveChecks,e=d?Af:Bf,f=e[b];if(f)return f;var g=b.split("."),h=g.length;if(a.csp)f = 6 > h?ed(g[0],g[1],g[2],g[3],g[4],c,d):function(a,b){var e=0,f;do f = ed(g[e++],g[e++],g[e++],g[e++],g[e++],c,d)(a,b),b = t,a = f;while(e < h);return f;};else {var l="";d && (l += "s = eso(s, fe);\nl = eso(l, fe);\n");var k=d;r(g,function(a,b){ua(a,c);var e=(b?"s":"((l&&l.hasOwnProperty(\"" + a + "\"))?l:s)") + "." + a;if(d || Pa(a))e = "eso(" + e + ", fe)",k = !0;l += "if(s == null) return undefined;\ns=" + e + ";\n";});l += "return s;";a = new Function("s","l","eso","fe",l);a.toString = ea(l);k && (a = yf(a,c));f = a;}f.sharedGetter = !0;f.assign = function(a,c,d){return hb(a,d,b,c,b);};return e[b] = f;}function gc(b){return G(b.valueOf)?b.valueOf():Cf.call(b);}function Oe(){var b=ia(),a=ia();this.$get = ["$filter","$sniffer",function(c,d){function e(a){var b=a;a.sharedGetter && (b = function(b,c){return a(b,c);},b.literal = a.literal,b.constant = a.constant,b.assign = a.assign);return b;}function f(a,b){for(var c=0,d=a.length;c < d;c++) {var e=a[c];e.constant || (e.inputs?f(e.inputs,b):-1 === b.indexOf(e) && b.push(e));}return b;}function g(a,b){return null == a || null == b?a === b:"object" === typeof a && (a = gc(a),"object" === typeof a)?!1:a === b || a !== a && b !== b;}function h(a,b,c,d){var e=d.$$inputs || (d.$$inputs = f(d.inputs,[])),h;if(1 === e.length){var k=g,e=e[0];return a.$watch(function(a){var b=e(a);g(b,k) || (h = d(a),k = b && gc(b));return h;},b,c);}for(var l=[],q=0,p=e.length;q < p;q++) l[q] = g;return a.$watch(function(a){for(var b=!1,c=0,f=e.length;c < f;c++) {var k=e[c](a);if(b || (b = !g(k,l[c])))l[c] = k && gc(k);}b && (h = d(a));return h;},b,c);}function l(a,b,c,d){var e,f;return e = a.$watch(function(a){return d(a);},function(a,c,d){f = a;G(b) && b.apply(this,arguments);y(a) && d.$$postDigest(function(){y(f) && e();});},c);}function k(a,b,c,d){function e(a){var b=!0;r(a,function(a){y(a) || (b = !1);});return b;}var f,g;return f = a.$watch(function(a){return d(a);},function(a,c,d){g = a;G(b) && b.call(this,a,c,d);e(a) && d.$$postDigest(function(){e(g) && f();});},c);}function n(a,b,c,d){var e;return e = a.$watch(function(a){return d(a);},function(a,c,d){G(b) && b.apply(this,arguments);e();},c);}function p(a,b){if(!b)return a;var c=a.$$watchDelegate,c=c !== k && c !== l?function(c,d){var e=a(c,d);return b(e,c,d);}:function(c,d){var e=a(c,d),f=b(e,c,d);return y(e)?f:e;};a.$$watchDelegate && a.$$watchDelegate !== h?c.$$watchDelegate = a.$$watchDelegate:b.$stateful || (c.$$watchDelegate = h,c.inputs = [a]);return c;}var q={csp:d.csp,expensiveChecks:!1},u={csp:d.csp,expensiveChecks:!0};return function(d,f,g){var m,r,t;switch(typeof d){case "string":t = d = d.trim();var L=g?a:b;m = L[t];m || (":" === d.charAt(0) && ":" === d.charAt(1) && (r = !0,d = d.substring(2)),g = g?u:q,m = new hc(g),m = new ib(m,c,g).parse(d),m.constant?m.$$watchDelegate = n:r?(m = e(m),m.$$watchDelegate = m.literal?k:l):m.inputs && (m.$$watchDelegate = h),L[t] = m);return p(m,f);case "function":return p(d,f);default:return p(E,f);}};}];}function Qe(){this.$get = ["$rootScope","$exceptionHandler",function(b,a){return fd(function(a){b.$evalAsync(a);},a);}];}function Re(){this.$get = ["$browser","$exceptionHandler",function(b,a){return fd(function(a){b.defer(a);},a);}];}function fd(b,a){function c(a,b,c){function d(b){return function(c){e || (e = !0,b.call(a,c));};}var e=!1;return [d(b),d(c)];}function d(){this.$$state = {status:0};}function e(a,b){return function(c){b.call(a,c);};}function f(c){!c.processScheduled && c.pending && (c.processScheduled = !0,b(function(){var b,d,e;e = c.pending;c.processScheduled = !1;c.pending = t;for(var f=0,g=e.length;f < g;++f) {d = e[f][0];b = e[f][c.status];try{G(b)?d.resolve(b(c.value)):1 === c.status?d.resolve(c.value):d.reject(c.value);}catch(h) {d.reject(h),a(h);}}}));}function g(){this.promise = new d();this.resolve = e(this,this.resolve);this.reject = e(this,this.reject);this.notify = e(this,this.notify);}var h=R("$q",TypeError);d.prototype = {then:function then(a,b,c){var d=new g();this.$$state.pending = this.$$state.pending || [];this.$$state.pending.push([d,a,b,c]);0 < this.$$state.status && f(this.$$state);return d.promise;},"catch":function _catch(a){return this.then(null,a);},"finally":function _finally(a,b){return this.then(function(b){return k(b,!0,a);},function(b){return k(b,!1,a);},b);}};g.prototype = {resolve:function resolve(a){this.promise.$$state.status || (a === this.promise?this.$$reject(h("qcycle",a)):this.$$resolve(a));},$$resolve:function $$resolve(b){var d,e;e = c(this,this.$$resolve,this.$$reject);try{if(J(b) || G(b))d = b && b.then;G(d)?(this.promise.$$state.status = -1,d.call(b,e[0],e[1],this.notify)):(this.promise.$$state.value = b,this.promise.$$state.status = 1,f(this.promise.$$state));}catch(g) {e[1](g),a(g);}},reject:function reject(a){this.promise.$$state.status || this.$$reject(a);},$$reject:function $$reject(a){this.promise.$$state.value = a;this.promise.$$state.status = 2;f(this.promise.$$state);},notify:function notify(c){var d=this.promise.$$state.pending;0 >= this.promise.$$state.status && d && d.length && b(function(){for(var b,e,f=0,g=d.length;f < g;f++) {e = d[f][0];b = d[f][3];try{e.notify(G(b)?b(c):c);}catch(h) {a(h);}}});}};var l=function l(a,b){var c=new g();b?c.resolve(a):c.reject(a);return c.promise;},k=function k(a,b,c){var d=null;try{G(c) && (d = c());}catch(e) {return l(e,!1);}return d && G(d.then)?d.then(function(){return l(a,b);},function(a){return l(a,!1);}):l(a,b);},n=function n(a,b,c,d){var e=new g();e.resolve(a);return e.promise.then(b,c,d);},p=function u(a){if(!G(a))throw h("norslvr",a);if(!(this instanceof u))return new u(a);var b=new g();a(function(a){b.resolve(a);},function(a){b.reject(a);});return b.promise;};p.defer = function(){return new g();};p.reject = function(a){var b=new g();b.reject(a);return b.promise;};p.when = n;p.all = function(a){var b=new g(),c=0,d=H(a)?[]:{};r(a,function(a,e){c++;n(a).then(function(a){d.hasOwnProperty(e) || (d[e] = a,--c || b.resolve(d));},function(a){d.hasOwnProperty(e) || b.reject(a);});});0 === c && b.resolve(d);return b.promise;};return p;}function $e(){this.$get = ["$window","$timeout",function(b,a){var c=b.requestAnimationFrame || b.webkitRequestAnimationFrame,d=b.cancelAnimationFrame || b.webkitCancelAnimationFrame || b.webkitCancelRequestAnimationFrame,e=!!c,f=e?function(a){var b=c(a);return function(){d(b);};}:function(b){var c=a(b,16.66,!1);return function(){a.cancel(c);};};f.supported = e;return f;}];}function Pe(){function b(a){function b(){this.$$watchers = this.$$nextSibling = this.$$childHead = this.$$childTail = null;this.$$listeners = {};this.$$listenerCount = {};this.$$watchersCount = 0;this.$id = ++ob;this.$$ChildScope = null;}b.prototype = a;return b;}var a=10,c=R("$rootScope"),d=null,e=null;this.digestTtl = function(b){arguments.length && (a = b);return a;};this.$get = ["$injector","$exceptionHandler","$parse","$browser",function(f,g,h,l){function k(a){a.currentScope.$$destroyed = !0;}function n(){this.$id = ++ob;this.$$phase = this.$parent = this.$$watchers = this.$$nextSibling = this.$$prevSibling = this.$$childHead = this.$$childTail = null;this.$root = this;this.$$destroyed = !1;this.$$listeners = {};this.$$listenerCount = {};this.$$isolateBindings = null;}function p(a){if(v.$$phase)throw c("inprog",v.$$phase);v.$$phase = a;}function q(a,b,c){do a.$$listenerCount[c] -= b,0 === a.$$listenerCount[c] && delete a.$$listenerCount[c];while(a = a.$parent);}function u(){}function s(){for(;t.length;) try{t.shift()();}catch(a) {g(a);}e = null;}function M(){null === e && (e = l.defer(function(){v.$apply(s);}));}n.prototype = {constructor:n,$new:function $new(a,c){var d;c = c || this;a?(d = new n(),d.$root = this.$root):(this.$$ChildScope || (this.$$ChildScope = b(this)),d = new this.$$ChildScope());d.$parent = c;d.$$prevSibling = c.$$childTail;c.$$childHead?(c.$$childTail.$$nextSibling = d,c.$$childTail = d):c.$$childHead = c.$$childTail = d;(a || c != this) && d.$on("$destroy",k);return d;},$watch:function $watch(a,b,c){var e=h(a);if(e.$$watchDelegate)return e.$$watchDelegate(this,b,c,e);var f=this.$$watchers,g={fn:b,last:u,get:e,exp:a,eq:!!c};d = null;G(b) || (g.fn = E);f || (f = this.$$watchers = []);f.unshift(g);return function(){Xa(f,g);d = null;};},$watchGroup:function $watchGroup(a,b){function c(){h = !1;k?(k = !1,b(e,e,g)):b(e,d,g);}var d=Array(a.length),e=Array(a.length),f=[],g=this,h=!1,k=!0;if(!a.length){var l=!0;g.$evalAsync(function(){l && b(e,e,g);});return function(){l = !1;};}if(1 === a.length)return this.$watch(a[0],function(a,c,f){e[0] = a;d[0] = c;b(e,a === c?e:d,f);});r(a,function(a,b){var k=g.$watch(a,function(a,f){e[b] = a;d[b] = f;h || (h = !0,g.$evalAsync(c));});f.push(k);});return function(){for(;f.length;) f.shift()();};},$watchCollection:function $watchCollection(a,b){function c(a){e = a;var b,d,g,h;if(!x(e)){if(J(e))if(Sa(e))for(f !== p && (f = p,u = f.length = 0,l++),a = e.length,u !== a && (l++,f.length = u = a),b = 0;b < a;b++) h = f[b],g = e[b],d = h !== h && g !== g,d || h === g || (l++,f[b] = g);else {f !== n && (f = n = {},u = 0,l++);a = 0;for(b in e) e.hasOwnProperty(b) && (a++,g = e[b],h = f[b],b in f?(d = h !== h && g !== g,d || h === g || (l++,f[b] = g)):(u++,f[b] = g,l++));if(u > a)for(b in (l++,f)) e.hasOwnProperty(b) || (u--,delete f[b]);}else f !== e && (f = e,l++);return l;}}c.$stateful = !0;var d=this,e,f,g,k=1 < b.length,l=0,q=h(a,c),p=[],n={},m=!0,u=0;return this.$watch(q,function(){m?(m = !1,b(e,e,d)):b(e,g,d);if(k)if(J(e))if(Sa(e)){g = Array(e.length);for(var a=0;a < e.length;a++) g[a] = e[a];}else for(a in (g = {},e)) tc.call(e,a) && (g[a] = e[a]);else g = e;});},$digest:function $digest(){var b,f,h,k,q,n,r=a,t,O=[],M,y;p("$digest");l.$$checkUrlChange();this === v && null !== e && (l.defer.cancel(e),s());d = null;do {n = !1;for(t = this;m.length;) {try{y = m.shift(),y.scope.$eval(y.expression,y.locals);}catch(w) {g(w);}d = null;}a: do {if(k = t.$$watchers)for(q = k.length;q--;) try{if(b = k[q])if((f = b.get(t)) !== (h = b.last) && !(b.eq?ha(f,h):"number" === typeof f && "number" === typeof h && isNaN(f) && isNaN(h)))n = !0,d = b,b.last = b.eq?Da(f,null):f,b.fn(f,h === u?f:h,t),5 > r && (M = 4 - r,O[M] || (O[M] = []),O[M].push({msg:G(b.exp)?"fn: " + (b.exp.name || b.exp.toString()):b.exp,newVal:f,oldVal:h}));else if(b === d){n = !1;break a;}}catch(A) {g(A);}if(!(k = t.$$childHead || t !== this && t.$$nextSibling))for(;t !== this && !(k = t.$$nextSibling);) t = t.$parent;}while(t = k);if((n || m.length) && ! r--)throw (v.$$phase = null,c("infdig",a,O));}while(n || m.length);for(v.$$phase = null;F.length;) try{F.shift()();}catch(x) {g(x);}},$destroy:function $destroy(){if(!this.$$destroyed){var a=this.$parent;this.$broadcast("$destroy");this.$$destroyed = !0;if(this !== v){for(var b in this.$$listenerCount) q(this,this.$$listenerCount[b],b);a.$$childHead == this && (a.$$childHead = this.$$nextSibling);a.$$childTail == this && (a.$$childTail = this.$$prevSibling);this.$$prevSibling && (this.$$prevSibling.$$nextSibling = this.$$nextSibling);this.$$nextSibling && (this.$$nextSibling.$$prevSibling = this.$$prevSibling);this.$destroy = this.$digest = this.$apply = this.$evalAsync = this.$applyAsync = E;this.$on = this.$watch = this.$watchGroup = function(){return E;};this.$$listeners = {};this.$parent = this.$$nextSibling = this.$$prevSibling = this.$$childHead = this.$$childTail = this.$root = this.$$watchers = null;}}},$eval:function $eval(a,b){return h(a)(this,b);},$evalAsync:function $evalAsync(a,b){v.$$phase || m.length || l.defer(function(){m.length && v.$digest();});m.push({scope:this,expression:a,locals:b});},$$postDigest:function $$postDigest(a){F.push(a);},$apply:function $apply(a){try{return (p("$apply"),this.$eval(a));}catch(b) {g(b);}finally {v.$$phase = null;try{v.$digest();}catch(c) {throw (g(c),c);}}},$applyAsync:function $applyAsync(a){function b(){c.$eval(a);}var c=this;a && t.push(b);M();},$on:function $on(a,b){var c=this.$$listeners[a];c || (this.$$listeners[a] = c = []);c.push(b);var d=this;do d.$$listenerCount[a] || (d.$$listenerCount[a] = 0),d.$$listenerCount[a]++;while(d = d.$parent);var e=this;return function(){var d=c.indexOf(b);-1 !== d && (c[d] = null,q(e,1,a));};},$emit:function $emit(a,b){var c=[],d,e=this,f=!1,h={name:a,targetScope:e,stopPropagation:function stopPropagation(){f = !0;},preventDefault:function preventDefault(){h.defaultPrevented = !0;},defaultPrevented:!1},k=Ya([h],arguments,1),l,q;do {d = e.$$listeners[a] || c;h.currentScope = e;l = 0;for(q = d.length;l < q;l++) if(d[l])try{d[l].apply(null,k);}catch(p) {g(p);}else d.splice(l,1),l--,q--;if(f)return (h.currentScope = null,h);e = e.$parent;}while(e);h.currentScope = null;return h;},$broadcast:function $broadcast(a,b){var c=this,d=this,e={name:a,targetScope:this,preventDefault:function preventDefault(){e.defaultPrevented = !0;},defaultPrevented:!1};if(!this.$$listenerCount[a])return e;for(var f=Ya([e],arguments,1),h,l;c = d;) {e.currentScope = c;d = c.$$listeners[a] || [];h = 0;for(l = d.length;h < l;h++) if(d[h])try{d[h].apply(null,f);}catch(k) {g(k);}else d.splice(h,1),h--,l--;if(!(d = c.$$listenerCount[a] && c.$$childHead || c !== this && c.$$nextSibling))for(;c !== this && !(d = c.$$nextSibling);) c = c.$parent;}e.currentScope = null;return e;}};var v=new n(),m=v.$$asyncQueue = [],F=v.$$postDigestQueue = [],t=v.$$applyAsyncQueue = [];return v;}];}function Sd(){var b=/^\s*(https?|ftp|mailto|tel|file):/,a=/^\s*((https?|ftp|file|blob):|data:image\/)/;this.aHrefSanitizationWhitelist = function(a){return y(a)?(b = a,this):b;};this.imgSrcSanitizationWhitelist = function(b){return y(b)?(a = b,this):a;};this.$get = function(){return function(c,d){var e=d?a:b,f;f = Aa(c).href;return "" === f || f.match(e)?c:"unsafe:" + f;};};}function Df(b){if("self" === b)return b;if(C(b)){if(-1 < b.indexOf("***"))throw Ba("iwcard",b);b = gd(b).replace("\\*\\*",".*").replace("\\*","[^:/.?&;]*");return new RegExp("^" + b + "$");}if(Ua(b))return new RegExp("^" + b.source + "$");throw Ba("imatcher");}function hd(b){var a=[];y(b) && r(b,function(b){a.push(Df(b));});return a;}function Te(){this.SCE_CONTEXTS = pa;var b=["self"],a=[];this.resourceUrlWhitelist = function(a){arguments.length && (b = hd(a));return b;};this.resourceUrlBlacklist = function(b){arguments.length && (a = hd(b));return a;};this.$get = ["$injector",function(c){function d(a,b){return "self" === a?$c(b):!!a.exec(b.href);}function e(a){var b=function b(a){this.$$unwrapTrustedValue = function(){return a;};};a && (b.prototype = new a());b.prototype.valueOf = function(){return this.$$unwrapTrustedValue();};b.prototype.toString = function(){return this.$$unwrapTrustedValue().toString();};return b;}var f=function f(a){throw Ba("unsafe");};c.has("$sanitize") && (f = c.get("$sanitize"));var g=e(),h={};h[pa.HTML] = e(g);h[pa.CSS] = e(g);h[pa.URL] = e(g);h[pa.JS] = e(g);h[pa.RESOURCE_URL] = e(h[pa.URL]);return {trustAs:function trustAs(a,b){var c=h.hasOwnProperty(a)?h[a]:null;if(!c)throw Ba("icontext",a,b);if(null === b || b === t || "" === b)return b;if("string" !== typeof b)throw Ba("itype",a);return new c(b);},getTrusted:function getTrusted(c,e){if(null === e || e === t || "" === e)return e;var g=h.hasOwnProperty(c)?h[c]:null;if(g && e instanceof g)return e.$$unwrapTrustedValue();if(c === pa.RESOURCE_URL){var g=Aa(e.toString()),p,q,u=!1;p = 0;for(q = b.length;p < q;p++) if(d(b[p],g)){u = !0;break;}if(u)for(p = 0,q = a.length;p < q;p++) if(d(a[p],g)){u = !1;break;}if(u)return e;throw Ba("insecurl",e.toString());}if(c === pa.HTML)return f(e);throw Ba("unsafe");},valueOf:function valueOf(a){return a instanceof g?a.$$unwrapTrustedValue():a;}};}];}function Se(){var b=!0;this.enabled = function(a){arguments.length && (b = !!a);return b;};this.$get = ["$parse","$sceDelegate",function(a,c){if(b && 8 > Qa)throw Ba("iequirks");var d=sa(pa);d.isEnabled = function(){return b;};d.trustAs = c.trustAs;d.getTrusted = c.getTrusted;d.valueOf = c.valueOf;b || (d.trustAs = d.getTrusted = function(a,b){return b;},d.valueOf = ra);d.parseAs = function(b,c){var e=a(c);return e.literal && e.constant?e:a(c,function(a){return d.getTrusted(b,a);});};var e=d.parseAs,f=d.getTrusted,g=d.trustAs;r(pa,function(a,b){var c=z(b);d[db("parse_as_" + c)] = function(b){return e(a,b);};d[db("get_trusted_" + c)] = function(b){return f(a,b);};d[db("trust_as_" + c)] = function(b){return g(a,b);};});return d;}];}function Ue(){this.$get = ["$window","$document",function(b,a){var c={},d=aa((/android (\d+)/.exec(z((b.navigator || {}).userAgent)) || [])[1]),e=/Boxee/i.test((b.navigator || {}).userAgent),f=a[0] || {},g,h=/^(Moz|webkit|ms)(?=[A-Z])/,l=f.body && f.body.style,k=!1,n=!1;if(l){for(var p in l) if(k = h.exec(p)){g = k[0];g = g.substr(0,1).toUpperCase() + g.substr(1);break;}g || (g = "WebkitOpacity" in l && "webkit");k = !!("transition" in l || g + "Transition" in l);n = !!("animation" in l || g + "Animation" in l);!d || k && n || (k = C(f.body.style.webkitTransition),n = C(f.body.style.webkitAnimation));}return {history:!(!b.history || !b.history.pushState || 4 > d || e),hasEvent:function hasEvent(a){if("input" === a && 11 >= Qa)return !1;if(x(c[a])){var b=f.createElement("div");c[a] = "on" + a in b;}return c[a];},csp:bb(),vendorPrefix:g,transitions:k,animations:n,android:d};}];}function We(){this.$get = ["$templateCache","$http","$q",function(b,a,c){function d(e,f){d.totalPendingRequests++;var g=a.defaults && a.defaults.transformResponse;H(g)?g = g.filter(function(a){return a !== Zb;}):g === Zb && (g = null);return a.get(e,{cache:b,transformResponse:g})["finally"](function(){d.totalPendingRequests--;}).then(function(a){return a.data;},function(a){if(!f)throw la("tpload",e);return c.reject(a);});}d.totalPendingRequests = 0;return d;}];}function Xe(){this.$get = ["$rootScope","$browser","$location",function(b,a,c){return {findBindings:function findBindings(a,b,c){a = a.getElementsByClassName("ng-binding");var g=[];r(a,function(a){var d=ca.element(a).data("$binding");d && r(d,function(d){c?new RegExp("(^|\\s)" + gd(b) + "(\\s|\\||$)").test(d) && g.push(a):-1 != d.indexOf(b) && g.push(a);});});return g;},findModels:function findModels(a,b,c){for(var g=["ng-","data-ng-","ng\\:"],h=0;h < g.length;++h) {var l=a.querySelectorAll("[" + g[h] + "model" + (c?"=":"*=") + "\"" + b + "\"]");if(l.length)return l;}},getLocation:function getLocation(){return c.url();},setLocation:function setLocation(a){a !== c.url() && (c.url(a),b.$digest());},whenStable:function whenStable(b){a.notifyWhenNoOutstandingRequests(b);}};}];}function Ye(){this.$get = ["$rootScope","$browser","$q","$$q","$exceptionHandler",function(b,a,c,d,e){function f(f,l,k){var n=y(k) && !k,p=(n?d:c).defer(),q=p.promise;l = a.defer(function(){try{p.resolve(f());}catch(a) {p.reject(a),e(a);}finally {delete g[q.$$timeoutId];}n || b.$apply();},l);q.$$timeoutId = l;g[l] = p;return q;}var g={};f.cancel = function(b){return b && b.$$timeoutId in g?(g[b.$$timeoutId].reject("canceled"),delete g[b.$$timeoutId],a.defer.cancel(b.$$timeoutId)):!1;};return f;}];}function Aa(b){Qa && ($.setAttribute("href",b),b = $.href);$.setAttribute("href",b);return {href:$.href,protocol:$.protocol?$.protocol.replace(/:$/,""):"",host:$.host,search:$.search?$.search.replace(/^\?/,""):"",hash:$.hash?$.hash.replace(/^#/,""):"",hostname:$.hostname,port:$.port,pathname:"/" === $.pathname.charAt(0)?$.pathname:"/" + $.pathname};}function $c(b){b = C(b)?Aa(b):b;return b.protocol === id.protocol && b.host === id.host;}function Ze(){this.$get = ea(Q);}function Fc(b){function a(c,d){if(J(c)){var e={};r(c,function(b,c){e[c] = a(c,b);});return e;}return b.factory(c + "Filter",d);}this.register = a;this.$get = ["$injector",function(a){return function(b){return a.get(b + "Filter");};}];a("currency",jd);a("date",kd);a("filter",Ef);a("json",Ff);a("limitTo",Gf);a("lowercase",Hf);a("number",ld);a("orderBy",md);a("uppercase",If);}function Ef(){return function(b,a,c){if(!H(b))return b;var d;switch(typeof a){case "function":break;case "boolean":case "number":case "string":d = !0;case "object":a = Jf(a,c,d);break;default:return b;}return b.filter(a);};}function Jf(b,a,c){var d=J(b) && "$" in b;!0 === a?a = ha:G(a) || (a = function(a,b){if(J(a) || J(b))return !1;a = z("" + a);b = z("" + b);return -1 !== a.indexOf(b);});return function(e){return d && !J(e)?Ha(e,b.$,a,!1):Ha(e,b,a,c);};}function Ha(_x14,_x15,_x16,_x17,_x18){var _again2=true;_function2: while(_again2) {var b=_x14,a=_x15,c=_x16,d=_x17,e=_x18;f = g = h = undefined;_again2 = false;var f=null !== b?typeof b:"null",g=null !== a?typeof a:"null";if("string" === g && "!" === a.charAt(0))return !Ha(b,a.substring(1),c,d);if(H(b))return b.some(function(b){return Ha(b,a,c,d);});switch(f){case "object":var h;if(d){for(h in b) if("$" !== h.charAt(0) && Ha(b[h],a,c,!0))return !0;if(e){return !1;}else {_x14 = b;_x15 = a;_x16 = c;_x17 = !1;_again2 = true;continue _function2;}}if("object" === g){for(h in a) if((e = a[h],!G(e) && !x(e) && (f = "$" === h,!Ha(f?b:b[h],e,c,f,f))))return !1;return !0;}return c(b,a);case "function":return !1;default:return c(b,a);}}}function jd(b){var a=b.NUMBER_FORMATS;return function(b,d,e){x(d) && (d = a.CURRENCY_SYM);x(e) && (e = a.PATTERNS[1].maxFrac);return null == b?b:nd(b,a.PATTERNS[1],a.GROUP_SEP,a.DECIMAL_SEP,e).replace(/\u00A4/g,d);};}function ld(b){var a=b.NUMBER_FORMATS;return function(b,d){return null == b?b:nd(b,a.PATTERNS[0],a.GROUP_SEP,a.DECIMAL_SEP,d);};}function nd(b,a,c,d,e){if(!isFinite(b) || J(b))return "";var f=0 > b;b = Math.abs(b);var g=b + "",h="",l=[],k=!1;if(-1 !== g.indexOf("e")){var n=g.match(/([\d\.]+)e(-?)(\d+)/);n && "-" == n[2] && n[3] > e + 1?b = 0:(h = g,k = !0);}if(k)0 < e && 1 > b && (h = b.toFixed(e),b = parseFloat(h));else {g = (g.split(od)[1] || "").length;x(e) && (e = Math.min(Math.max(a.minFrac,g),a.maxFrac));b = +(Math.round(+(b.toString() + "e" + e)).toString() + "e" + -e);var g=("" + b).split(od),k=g[0],g=g[1] || "",p=0,q=a.lgSize,u=a.gSize;if(k.length >= q + u)for(p = k.length - q,n = 0;n < p;n++) 0 === (p - n) % u && 0 !== n && (h += c),h += k.charAt(n);for(n = p;n < k.length;n++) 0 === (k.length - n) % q && 0 !== n && (h += c),h += k.charAt(n);for(;g.length < e;) g += "0";e && "0" !== e && (h += d + g.substr(0,e));}0 === b && (f = !1);l.push(f?a.negPre:a.posPre,h,f?a.negSuf:a.posSuf);return l.join("");}function Ib(b,a,c){var d="";0 > b && (d = "-",b = -b);for(b = "" + b;b.length < a;) b = "0" + b;c && (b = b.substr(b.length - a));return d + b;}function U(b,a,c,d){c = c || 0;return function(e){e = e["get" + b]();if(0 < c || e > -c)e += c;0 === e && -12 == c && (e = 12);return Ib(e,a,d);};}function Jb(b,a){return function(c,d){var e=c["get" + b](),f=ub(a?"SHORT" + b:b);return d[f][e];};}function pd(b){var a=new Date(b,0,1).getDay();return new Date(b,0,(4 >= a?5:12) - a);}function qd(b){return function(a){var c=pd(a.getFullYear());a = +new Date(a.getFullYear(),a.getMonth(),a.getDate() + (4 - a.getDay())) - +c;a = 1 + Math.round(a / 6048E5);return Ib(a,b);};}function ic(b,a){return 0 >= b.getFullYear()?a.ERAS[0]:a.ERAS[1];}function kd(b){function a(a){var b;if(b = a.match(c)){a = new Date(0);var f=0,g=0,h=b[8]?a.setUTCFullYear:a.setFullYear,l=b[8]?a.setUTCHours:a.setHours;b[9] && (f = aa(b[9] + b[10]),g = aa(b[9] + b[11]));h.call(a,aa(b[1]),aa(b[2]) - 1,aa(b[3]));f = aa(b[4] || 0) - f;g = aa(b[5] || 0) - g;h = aa(b[6] || 0);b = Math.round(1E3 * parseFloat("0." + (b[7] || 0)));l.call(a,f,g,h,b);}return a;}var c=/^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;return function(c,e,f){var g="",h=[],l,k;e = e || "mediumDate";e = b.DATETIME_FORMATS[e] || e;C(c) && (c = Kf.test(c)?aa(c):a(c));Y(c) && (c = new Date(c));if(!ga(c))return c;for(;e;) (k = Lf.exec(e))?(h = Ya(h,k,1),e = h.pop()):(h.push(e),e = null);f && "UTC" === f && (c = new Date(c.getTime()),c.setMinutes(c.getMinutes() + c.getTimezoneOffset()));r(h,function(a){l = Mf[a];g += l?l(c,b.DATETIME_FORMATS):a.replace(/(^'|'$)/g,"").replace(/''/g,"'");});return g;};}function Ff(){return function(b,a){x(a) && (a = 2);return $a(b,a);};}function Gf(){return function(b,a){Y(b) && (b = b.toString());return H(b) || C(b)?(a = Infinity === Math.abs(Number(a))?Number(a):aa(a))?0 < a?b.slice(0,a):b.slice(a):C(b)?"":[]:b;};}function md(b){return function(a,c,d){function e(a,b){return b?function(b,c){return a(c,b);}:a;}function f(a){switch(typeof a){case "number":case "boolean":case "string":return !0;default:return !1;}}function g(a){return null === a?"null":"function" === typeof a.valueOf && (a = a.valueOf(),f(a)) || "function" === typeof a.toString && (a = a.toString(),f(a))?a:"";}function h(a,b){var c=typeof a,d=typeof b;c === d && "object" === c && (a = g(a),b = g(b));return c === d?("string" === c && (a = a.toLowerCase(),b = b.toLowerCase()),a === b?0:a < b?-1:1):c < d?-1:1;}if(!Sa(a))return a;c = H(c)?c:[c];0 === c.length && (c = ["+"]);c = c.map(function(a){var c=!1,d=a || ra;if(C(a)){if("+" == a.charAt(0) || "-" == a.charAt(0))c = "-" == a.charAt(0),a = a.substring(1);if("" === a)return e(h,c);d = b(a);if(d.constant){var f=d();return e(function(a,b){return h(a[f],b[f]);},c);}}return e(function(a,b){return h(d(a),d(b));},c);});return Za.call(a).sort(e(function(a,b){for(var d=0;d < c.length;d++) {var e=c[d](a,b);if(0 !== e)return e;}return 0;},d));};}function Ia(b){G(b) && (b = {link:b});b.restrict = b.restrict || "AC";return ea(b);}function rd(b,a,c,d,e){var f=this,g=[],h=f.$$parentForm = b.parent().controller("form") || Kb;f.$error = {};f.$$success = {};f.$pending = t;f.$name = e(a.name || a.ngForm || "")(c);f.$dirty = !1;f.$pristine = !0;f.$valid = !0;f.$invalid = !1;f.$submitted = !1;h.$addControl(f);f.$rollbackViewValue = function(){r(g,function(a){a.$rollbackViewValue();});};f.$commitViewValue = function(){r(g,function(a){a.$commitViewValue();});};f.$addControl = function(a){La(a.$name,"input");g.push(a);a.$name && (f[a.$name] = a);};f.$$renameControl = function(a,b){var c=a.$name;f[c] === a && delete f[c];f[b] = a;a.$name = b;};f.$removeControl = function(a){a.$name && f[a.$name] === a && delete f[a.$name];r(f.$pending,function(b,c){f.$setValidity(c,null,a);});r(f.$error,function(b,c){f.$setValidity(c,null,a);});r(f.$$success,function(b,c){f.$setValidity(c,null,a);});Xa(g,a);};sd({ctrl:this,$element:b,set:function set(a,b,c){var d=a[b];d?-1 === d.indexOf(c) && d.push(c):a[b] = [c];},unset:function unset(a,b,c){var d=a[b];d && (Xa(d,c),0 === d.length && delete a[b]);},parentForm:h,$animate:d});f.$setDirty = function(){d.removeClass(b,Ra);d.addClass(b,Lb);f.$dirty = !0;f.$pristine = !1;h.$setDirty();};f.$setPristine = function(){d.setClass(b,Ra,Lb + " ng-submitted");f.$dirty = !1;f.$pristine = !0;f.$submitted = !1;r(g,function(a){a.$setPristine();});};f.$setUntouched = function(){r(g,function(a){a.$setUntouched();});};f.$setSubmitted = function(){d.addClass(b,"ng-submitted");f.$submitted = !0;h.$setSubmitted();};}function jc(b){b.$formatters.push(function(a){return b.$isEmpty(a)?a:a.toString();});}function jb(b,a,c,d,e,f){var g=z(a[0].type);if(!e.android){var h=!1;a.on("compositionstart",function(a){h = !0;});a.on("compositionend",function(){h = !1;l();});}var l=function l(b){k && (f.defer.cancel(k),k = null);if(!h){var e=a.val();b = b && b.type;"password" === g || c.ngTrim && "false" === c.ngTrim || (e = N(e));(d.$viewValue !== e || "" === e && d.$$hasNativeValidators) && d.$setViewValue(e,b);}};if(e.hasEvent("input"))a.on("input",l);else {var k,n=function n(a,b,c){k || (k = f.defer(function(){k = null;b && b.value === c || l(a);}));};a.on("keydown",function(a){var b=a.keyCode;91 === b || 15 < b && 19 > b || 37 <= b && 40 >= b || n(a,this,this.value);});if(e.hasEvent("paste"))a.on("paste cut",n);}a.on("change",l);d.$render = function(){a.val(d.$isEmpty(d.$viewValue)?"":d.$viewValue);};}function Mb(b,a){return function(c,d){var e,f;if(ga(c))return c;if(C(c)){"\"" == c.charAt(0) && "\"" == c.charAt(c.length - 1) && (c = c.substring(1,c.length - 1));if(Nf.test(c))return new Date(c);b.lastIndex = 0;if(e = b.exec(c))return (e.shift(),f = d?{yyyy:d.getFullYear(),MM:d.getMonth() + 1,dd:d.getDate(),HH:d.getHours(),mm:d.getMinutes(),ss:d.getSeconds(),sss:d.getMilliseconds() / 1E3}:{yyyy:1970,MM:1,dd:1,HH:0,mm:0,ss:0,sss:0},r(e,function(b,c){c < a.length && (f[a[c]] = +b);}),new Date(f.yyyy,f.MM - 1,f.dd,f.HH,f.mm,f.ss || 0,1E3 * f.sss || 0));}return NaN;};}function kb(b,a,c,d){return function(e,f,g,h,l,k,n){function p(a){return a && !(a.getTime && a.getTime() !== a.getTime());}function q(a){return y(a)?ga(a)?a:c(a):t;}td(e,f,g,h);jb(e,f,g,h,l,k);var u=h && h.$options && h.$options.timezone,s;h.$$parserName = b;h.$parsers.push(function(b){return h.$isEmpty(b)?null:a.test(b)?(b = c(b,s),"UTC" === u && b.setMinutes(b.getMinutes() - b.getTimezoneOffset()),b):t;});h.$formatters.push(function(a){if(a && !ga(a))throw Nb("datefmt",a);if(p(a)){if((s = a) && "UTC" === u){var b=6E4 * s.getTimezoneOffset();s = new Date(s.getTime() + b);}return n("date")(a,d,u);}s = null;return "";});if(y(g.min) || g.ngMin){var r;h.$validators.min = function(a){return !p(a) || x(r) || c(a) >= r;};g.$observe("min",function(a){r = q(a);h.$validate();});}if(y(g.max) || g.ngMax){var v;h.$validators.max = function(a){return !p(a) || x(v) || c(a) <= v;};g.$observe("max",function(a){v = q(a);h.$validate();});}};}function td(b,a,c,d){(d.$$hasNativeValidators = J(a[0].validity)) && d.$parsers.push(function(b){var c=a.prop("validity") || {};return c.badInput && !c.typeMismatch?t:b;});}function ud(b,a,c,d,e){if(y(d)){b = b(d);if(!b.constant)throw R("ngModel")("constexpr",c,d);return b(a);}return e;}function kc(b,a){b = "ngClass" + b;return ["$animate",function(c){function d(a,b){var c=[],d=0;a: for(;d < a.length;d++) {for(var e=a[d],n=0;n < b.length;n++) if(e == b[n])continue a;c.push(e);}return c;}function e(a){if(!H(a)){if(C(a))return a.split(" ");if(J(a)){var b=[];r(a,function(a,c){a && (b = b.concat(c.split(" ")));});return b;}}return a;}return {restrict:"AC",link:function link(f,g,h){function l(a,b){var c=g.data("$classCounts") || {},d=[];r(a,function(a){if(0 < b || c[a])c[a] = (c[a] || 0) + b,c[a] === +(0 < b) && d.push(a);});g.data("$classCounts",c);return d.join(" ");}function k(b){if(!0 === a || f.$index % 2 === a){var k=e(b || []);if(!n){var u=l(k,1);h.$addClass(u);}else if(!ha(b,n)){var s=e(n),u=d(k,s),k=d(s,k),u=l(u,1),k=l(k,-1);u && u.length && c.addClass(g,u);k && k.length && c.removeClass(g,k);}}n = sa(b);}var n;f.$watch(h[b],k,!0);h.$observe("class",function(a){k(f.$eval(h[b]));});"ngClass" !== b && f.$watch("$index",function(c,d){var g=c & 1;if(g !== (d & 1)){var k=e(f.$eval(h[b]));g === a?(g = l(k,1),h.$addClass(g)):(g = l(k,-1),h.$removeClass(g));}});}};}];}function sd(b){function a(a,b){b && !f[a]?(k.addClass(e,a),f[a] = !0):!b && f[a] && (k.removeClass(e,a),f[a] = !1);}function c(b,c){b = b?"-" + vc(b,"-"):"";a(lb + b,!0 === c);a(vd + b,!1 === c);}var d=b.ctrl,e=b.$element,f={},g=b.set,h=b.unset,l=b.parentForm,k=b.$animate;f[vd] = !(f[lb] = e.hasClass(lb));d.$setValidity = function(b,e,f){e === t?(d.$pending || (d.$pending = {}),g(d.$pending,b,f)):(d.$pending && h(d.$pending,b,f),wd(d.$pending) && (d.$pending = t));Wa(e)?e?(h(d.$error,b,f),g(d.$$success,b,f)):(g(d.$error,b,f),h(d.$$success,b,f)):(h(d.$error,b,f),h(d.$$success,b,f));d.$pending?(a(xd,!0),d.$valid = d.$invalid = t,c("",null)):(a(xd,!1),d.$valid = wd(d.$error),d.$invalid = !d.$valid,c("",d.$valid));e = d.$pending && d.$pending[b]?t:d.$error[b]?!1:d.$$success[b]?!0:null;c(b,e);l.$setValidity(b,e,d);};}function wd(b){if(b)for(var a in b) return !1;return !0;}var Of=/^\/(.+)\/([a-z]*)$/,z=function z(b){return C(b)?b.toLowerCase():b;},tc=Object.prototype.hasOwnProperty,ub=function ub(b){return C(b)?b.toUpperCase():b;},Qa,A,ta,Za=[].slice,qf=[].splice,Pf=[].push,Ca=Object.prototype.toString,Ja=R("ng"),ca=Q.angular || (Q.angular = {}),cb,ob=0;Qa = W.documentMode;E.$inject = [];ra.$inject = [];var H=Array.isArray,N=function N(b){return C(b)?b.trim():b;},gd=function gd(b){return b.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g,"\\$1").replace(/\x08/g,"\\x08");},bb=function bb(){if(y(bb.isActive_))return bb.isActive_;var b=!(!W.querySelector("[ng-csp]") && !W.querySelector("[data-ng-csp]"));if(!b)try{new Function("");}catch(a) {b = !0;}return bb.isActive_ = b;},rb=["ng-","data-ng-","ng:","x-ng-"],Md=/[A-Z]/g,wc=!1,Qb,qa=1,pb=3,Qd={full:"1.3.15",major:1,minor:3,dot:15,codeName:"locality-filtration"};T.expando = "ng339";var zb=T.cache = {},hf=1;T._data = function(b){return this.cache[b[this.expando]] || {};};var cf=/([\:\-\_]+(.))/g,df=/^moz([A-Z])/,Qf={mouseleave:"mouseout",mouseenter:"mouseover"},Tb=R("jqLite"),gf=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,Sb=/<|&#?\w+;/,ef=/<([\w:]+)/,ff=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,ja={option:[1,"<select multiple=\"multiple\">","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};ja.optgroup = ja.option;ja.tbody = ja.tfoot = ja.colgroup = ja.caption = ja.thead;ja.th = ja.td;var Ka=T.prototype = {ready:function ready(b){function a(){c || (c = !0,b());}var c=!1;"complete" === W.readyState?setTimeout(a):(this.on("DOMContentLoaded",a),T(Q).on("load",a));},toString:function toString(){var b=[];r(this,function(a){b.push("" + a);});return "[" + b.join(", ") + "]";},eq:function eq(b){return 0 <= b?A(this[b]):A(this[this.length + b]);},length:0,push:Pf,sort:[].sort,splice:[].splice},Eb={};r("multiple selected checked disabled readOnly required open".split(" "),function(b){Eb[z(b)] = b;});var Oc={};r("input select option textarea button form details".split(" "),function(b){Oc[b] = !0;});var Pc={ngMinlength:"minlength",ngMaxlength:"maxlength",ngMin:"min",ngMax:"max",ngPattern:"pattern"};r({data:Vb,removeData:xb},function(b,a){T[a] = b;});r({data:Vb,inheritedData:Db,scope:function scope(b){return A.data(b,"$scope") || Db(b.parentNode || b,["$isolateScope","$scope"]);},isolateScope:function isolateScope(b){return A.data(b,"$isolateScope") || A.data(b,"$isolateScopeNoTemplate");},controller:Kc,injector:function injector(b){return Db(b,"$injector");},removeAttr:function removeAttr(b,a){b.removeAttribute(a);},hasClass:Ab,css:function css(b,a,c){a = db(a);if(y(c))b.style[a] = c;else return b.style[a];},attr:function attr(b,a,c){var d=z(a);if(Eb[d])if(y(c))c?(b[a] = !0,b.setAttribute(a,d)):(b[a] = !1,b.removeAttribute(d));else return b[a] || (b.attributes.getNamedItem(a) || E).specified?d:t;else if(y(c))b.setAttribute(a,c);else if(b.getAttribute)return (b = b.getAttribute(a,2),null === b?t:b);},prop:function prop(b,a,c){if(y(c))b[a] = c;else return b[a];},text:(function(){function b(a,b){if(x(b)){var d=a.nodeType;return d === qa || d === pb?a.textContent:"";}a.textContent = b;}b.$dv = "";return b;})(),val:function val(b,a){if(x(a)){if(b.multiple && "select" === va(b)){var c=[];r(b.options,function(a){a.selected && c.push(a.value || a.text);});return 0 === c.length?null:c;}return b.value;}b.value = a;},html:function html(b,a){if(x(a))return b.innerHTML;wb(b,!0);b.innerHTML = a;},empty:Lc},function(b,a){T.prototype[a] = function(a,d){var e,f,g=this.length;if(b !== Lc && (2 == b.length && b !== Ab && b !== Kc?a:d) === t){if(J(a)){for(e = 0;e < g;e++) if(b === Vb)b(this[e],a);else for(f in a) b(this[e],f,a[f]);return this;}e = b.$dv;g = e === t?Math.min(g,1):g;for(f = 0;f < g;f++) {var h=b(this[f],a,d);e = e?e + h:h;}return e;}for(e = 0;e < g;e++) b(this[e],a,d);return this;};});r({removeData:xb,on:function a(c,d,e,f){if(y(f))throw Tb("onargs");if(Gc(c)){var g=yb(c,!0);f = g.events;var h=g.handle;h || (h = g.handle = lf(c,f));for(var g=0 <= d.indexOf(" ")?d.split(" "):[d],l=g.length;l--;) {d = g[l];var k=f[d];k || (f[d] = [],"mouseenter" === d || "mouseleave" === d?a(c,Qf[d],function(a){var c=a.relatedTarget;c && (c === this || this.contains(c)) || h(a,d);}):"$destroy" !== d && c.addEventListener(d,h,!1),k = f[d]);k.push(e);}}},off:Jc,one:function one(a,c,d){a = A(a);a.on(c,function f(){a.off(c,d);a.off(c,f);});a.on(c,d);},replaceWith:function replaceWith(a,c){var d,e=a.parentNode;wb(a);r(new T(c),function(c){d?e.insertBefore(c,d.nextSibling):e.replaceChild(c,a);d = c;});},children:function children(a){var c=[];r(a.childNodes,function(a){a.nodeType === qa && c.push(a);});return c;},contents:function contents(a){return a.contentDocument || a.childNodes || [];},append:function append(a,c){var d=a.nodeType;if(d === qa || 11 === d){c = new T(c);for(var d=0,e=c.length;d < e;d++) a.appendChild(c[d]);}},prepend:function prepend(a,c){if(a.nodeType === qa){var d=a.firstChild;r(new T(c),function(c){a.insertBefore(c,d);});}},wrap:function wrap(a,c){c = A(c).eq(0).clone()[0];var d=a.parentNode;d && d.replaceChild(c,a);c.appendChild(a);},remove:Mc,detach:function detach(a){Mc(a,!0);},after:function after(a,c){var d=a,e=a.parentNode;c = new T(c);for(var f=0,g=c.length;f < g;f++) {var h=c[f];e.insertBefore(h,d.nextSibling);d = h;}},addClass:Cb,removeClass:Bb,toggleClass:function toggleClass(a,c,d){c && r(c.split(" "),function(c){var f=d;x(f) && (f = !Ab(a,c));(f?Cb:Bb)(a,c);});},parent:function parent(a){return (a = a.parentNode) && 11 !== a.nodeType?a:null;},next:function next(a){return a.nextElementSibling;},find:function find(a,c){return a.getElementsByTagName?a.getElementsByTagName(c):[];},clone:Ub,triggerHandler:function triggerHandler(a,c,d){var e,f,g=c.type || c,h=yb(a);if(h = (h = h && h.events) && h[g])e = {preventDefault:function preventDefault(){this.defaultPrevented = !0;},isDefaultPrevented:function isDefaultPrevented(){return !0 === this.defaultPrevented;},stopImmediatePropagation:function stopImmediatePropagation(){this.immediatePropagationStopped = !0;},isImmediatePropagationStopped:function isImmediatePropagationStopped(){return !0 === this.immediatePropagationStopped;},stopPropagation:E,type:g,target:a},c.type && (e = w(e,c)),c = sa(h),f = d?[e].concat(d):[e],r(c,function(c){e.isImmediatePropagationStopped() || c.apply(a,f);});}},function(a,c){T.prototype[c] = function(c,e,f){for(var g,h=0,l=this.length;h < l;h++) x(g)?(g = a(this[h],c,e,f),y(g) && (g = A(g))):Ic(g,a(this[h],c,e,f));return y(g)?g:this;};T.prototype.bind = T.prototype.on;T.prototype.unbind = T.prototype.off;});eb.prototype = {put:function put(a,c){this[Ma(a,this.nextUid)] = c;},get:function get(a){return this[Ma(a,this.nextUid)];},remove:function remove(a){var c=this[a = Ma(a,this.nextUid)];delete this[a];return c;}};var Rc=/^function\s*[^\(]*\(\s*([^\)]*)\)/m,Rf=/,/,Sf=/^\s*(_?)(\S+?)\1\s*$/,Qc=/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,Fa=R("$injector");ab.$$annotate = function(a,c,d){var e;if("function" === typeof a){if(!(e = a.$inject)){e = [];if(a.length){if(c)throw (C(d) && d || (d = a.name || mf(a)),Fa("strictdi",d));c = a.toString().replace(Qc,"");c = c.match(Rc);r(c[1].split(Rf),function(a){a.replace(Sf,function(a,c,d){e.push(d);});});}a.$inject = e;}}else H(a)?(c = a.length - 1,sb(a[c],"fn"),e = a.slice(0,c)):sb(a,"fn",!0);return e;};var Tf=R("$animate"),Ce=["$provide",function(a){this.$$selectors = {};this.register = function(c,d){var e=c + "-animation";if(c && "." != c.charAt(0))throw Tf("notcsel",c);this.$$selectors[c.substr(1)] = e;a.factory(e,d);};this.classNameFilter = function(a){1 === arguments.length && (this.$$classNameFilter = a instanceof RegExp?a:null);return this.$$classNameFilter;};this.$get = ["$$q","$$asyncCallback","$rootScope",function(a,d,e){function f(d){var f,g=a.defer();g.promise.$$cancelFn = function(){f && f();};e.$$postDigest(function(){f = d(function(){g.resolve();});});return g.promise;}function g(a,c){var d=[],e=[],f=ia();r((a.attr("class") || "").split(/\s+/),function(a){f[a] = !0;});r(c,function(a,c){var g=f[c];!1 === a && g?e.push(c):!0 !== a || g || d.push(c);});return 0 < d.length + e.length && [d.length?d:null,e.length?e:null];}function h(a,c,d){for(var e=0,f=c.length;e < f;++e) a[c[e]] = d;}function l(){n || (n = a.defer(),d(function(){n.resolve();n = null;}));return n.promise;}function k(a,c){if(ca.isObject(c)){var d=w(c.from || {},c.to || {});a.css(d);}}var n;return {animate:function animate(a,c,d){k(a,{from:c,to:d});return l();},enter:function enter(a,c,d,e){k(a,e);d?d.after(a):c.prepend(a);return l();},leave:function leave(a,c){k(a,c);a.remove();return l();},move:function move(a,c,d,e){return this.enter(a,c,d,e);},addClass:function addClass(a,c,d){return this.setClass(a,c,[],d);},$$addClassImmediately:function $$addClassImmediately(a,c,d){a = A(a);c = C(c)?c:H(c)?c.join(" "):"";r(a,function(a){Cb(a,c);});k(a,d);return l();},removeClass:function removeClass(a,c,d){return this.setClass(a,[],c,d);},$$removeClassImmediately:function $$removeClassImmediately(a,c,d){a = A(a);c = C(c)?c:H(c)?c.join(" "):"";r(a,function(a){Bb(a,c);});k(a,d);return l();},setClass:function setClass(a,c,d,e){var k=this,l=!1;a = A(a);var m=a.data("$$animateClasses");m?e && m.options && (m.options = ca.extend(m.options || {},e)):(m = {classes:{},options:e},l = !0);e = m.classes;c = H(c)?c:c.split(" ");d = H(d)?d:d.split(" ");h(e,c,!0);h(e,d,!1);l && (m.promise = f(function(c){var d=a.data("$$animateClasses");a.removeData("$$animateClasses");if(d){var e=g(a,d.classes);e && k.$$setClassImmediately(a,e[0],e[1],d.options);}c();}),a.data("$$animateClasses",m));return m.promise;},$$setClassImmediately:function $$setClassImmediately(a,c,d,e){c && this.$$addClassImmediately(a,c);d && this.$$removeClassImmediately(a,d);k(a,e);return l();},enabled:E,cancel:E};}];}],la=R("$compile");yc.$inject = ["$provide","$$sanitizeUriProvider"];var Sc=/^((?:x|data)[\:\-_])/i,rf=R("$controller"),Wc="application/json",$b={"Content-Type":Wc + ";charset=utf-8"},tf=/^\[|^\{(?!\{)/,uf={"[":/]$/,"{":/}$/},sf=/^\)\]\}',?\n/,ac=R("$interpolate"),Uf=/^([^\?#]*)(\?([^#]*))?(#(.*))?$/,xf={http:80,https:443,ftp:21},Gb=R("$location"),Vf={$$html5:!1,$$replace:!1,absUrl:Hb("$$absUrl"),url:function url(a){if(x(a))return this.$$url;var c=Uf.exec(a);(c[1] || "" === a) && this.path(decodeURIComponent(c[1]));(c[2] || c[1] || "" === a) && this.search(c[3] || "");this.hash(c[5] || "");return this;},protocol:Hb("$$protocol"),host:Hb("$$host"),port:Hb("$$port"),path:dd("$$path",function(a){a = null !== a?a.toString():"";return "/" == a.charAt(0)?a:"/" + a;}),search:function search(a,c){switch(arguments.length){case 0:return this.$$search;case 1:if(C(a) || Y(a))a = a.toString(),this.$$search = sc(a);else if(J(a))a = Da(a,{}),r(a,function(c,e){null == c && delete a[e];}),this.$$search = a;else throw Gb("isrcharg");break;default:x(c) || null === c?delete this.$$search[a]:this.$$search[a] = c;}this.$$compose();return this;},hash:dd("$$hash",function(a){return null !== a?a.toString():"";}),replace:function replace(){this.$$replace = !0;return this;}};r([cd,ec,dc],function(a){a.prototype = Object.create(Vf);a.prototype.state = function(c){if(!arguments.length)return this.$$state;if(a !== dc || !this.$$html5)throw Gb("nostate");this.$$state = x(c)?null:c;return this;};});var na=R("$parse"),Wf=Function.prototype.call,Xf=Function.prototype.apply,Yf=Function.prototype.bind,mb=ia();r({"null":function _null(){return null;},"true":function _true(){return !0;},"false":function _false(){return !1;},undefined:function undefined(){}},function(a,c){a.constant = a.literal = a.sharedGetter = !0;mb[c] = a;});mb["this"] = function(a){return a;};mb["this"].sharedGetter = !0;var nb=w(ia(),{"+":function _(a,c,d,e){d = d(a,c);e = e(a,c);return y(d)?y(e)?d + e:d:y(e)?e:t;},"-":function _(a,c,d,e){d = d(a,c);e = e(a,c);return (y(d)?d:0) - (y(e)?e:0);},"*":function _(a,c,d,e){return d(a,c) * e(a,c);},"/":function _(a,c,d,e){return d(a,c) / e(a,c);},"%":function _(a,c,d,e){return d(a,c) % e(a,c);},"===":function _(a,c,d,e){return d(a,c) === e(a,c);},"!==":function _(a,c,d,e){return d(a,c) !== e(a,c);},"==":function _(a,c,d,e){return d(a,c) == e(a,c);},"!=":function _(a,c,d,e){return d(a,c) != e(a,c);},"<":function _(a,c,d,e){return d(a,c) < e(a,c);},">":function _(a,c,d,e){return d(a,c) > e(a,c);},"<=":function _(a,c,d,e){return d(a,c) <= e(a,c);},">=":function _(a,c,d,e){return d(a,c) >= e(a,c);},"&&":function _(a,c,d,e){return d(a,c) && e(a,c);},"||":function _(a,c,d,e){return d(a,c) || e(a,c);},"!":function _(a,c,d){return !d(a,c);},"=":!0,"|":!0}),Zf={n:"\n",f:"\f",r:"\r",t:"\t",v:"\u000b","'":"'","\"":"\""},hc=function hc(a){this.options = a;};hc.prototype = {constructor:hc,lex:function lex(a){this.text = a;this.index = 0;for(this.tokens = [];this.index < this.text.length;) if((a = this.text.charAt(this.index),"\"" === a || "'" === a))this.readString(a);else if(this.isNumber(a) || "." === a && this.isNumber(this.peek()))this.readNumber();else if(this.isIdent(a))this.readIdent();else if(this.is(a,"(){}[].,;:?"))this.tokens.push({index:this.index,text:a}),this.index++;else if(this.isWhitespace(a))this.index++;else {var c=a + this.peek(),d=c + this.peek(2),e=nb[c],f=nb[d];nb[a] || e || f?(a = f?d:e?c:a,this.tokens.push({index:this.index,text:a,operator:!0}),this.index += a.length):this.throwError("Unexpected next character ",this.index,this.index + 1);}return this.tokens;},is:function is(a,c){return -1 !== c.indexOf(a);},peek:function peek(a){a = a || 1;return this.index + a < this.text.length?this.text.charAt(this.index + a):!1;},isNumber:function isNumber(a){return "0" <= a && "9" >= a && "string" === typeof a;},isWhitespace:function isWhitespace(a){return " " === a || "\r" === a || "\t" === a || "\n" === a || "\u000b" === a || " " === a;},isIdent:function isIdent(a){return "a" <= a && "z" >= a || "A" <= a && "Z" >= a || "_" === a || "$" === a;},isExpOperator:function isExpOperator(a){return "-" === a || "+" === a || this.isNumber(a);},throwError:function throwError(a,c,d){d = d || this.index;c = y(c)?"s " + c + "-" + this.index + " [" + this.text.substring(c,d) + "]":" " + d;throw na("lexerr",a,c,this.text);},readNumber:function readNumber(){for(var a="",c=this.index;this.index < this.text.length;) {var d=z(this.text.charAt(this.index));if("." == d || this.isNumber(d))a += d;else {var e=this.peek();if("e" == d && this.isExpOperator(e))a += d;else if(this.isExpOperator(d) && e && this.isNumber(e) && "e" == a.charAt(a.length - 1))a += d;else if(!this.isExpOperator(d) || e && this.isNumber(e) || "e" != a.charAt(a.length - 1))break;else this.throwError("Invalid exponent");}this.index++;}this.tokens.push({index:c,text:a,constant:!0,value:Number(a)});},readIdent:function readIdent(){for(var a=this.index;this.index < this.text.length;) {var c=this.text.charAt(this.index);if(!this.isIdent(c) && !this.isNumber(c))break;this.index++;}this.tokens.push({index:a,text:this.text.slice(a,this.index),identifier:!0});},readString:function readString(a){var c=this.index;this.index++;for(var d="",e=a,f=!1;this.index < this.text.length;) {var g=this.text.charAt(this.index),e=e + g;if(f)"u" === g?(f = this.text.substring(this.index + 1,this.index + 5),f.match(/[\da-f]{4}/i) || this.throwError("Invalid unicode escape [\\u" + f + "]"),this.index += 4,d += String.fromCharCode(parseInt(f,16))):d += Zf[g] || g,f = !1;else if("\\" === g)f = !0;else {if(g === a){this.index++;this.tokens.push({index:c,text:e,constant:!0,value:d});return;}d += g;}this.index++;}this.throwError("Unterminated quote",c);}};var ib=function ib(a,c,d){this.lexer = a;this.$filter = c;this.options = d;};ib.ZERO = w(function(){return 0;},{sharedGetter:!0,constant:!0});ib.prototype = {constructor:ib,parse:function parse(a){this.text = a;this.tokens = this.lexer.lex(a);a = this.statements();0 !== this.tokens.length && this.throwError("is an unexpected token",this.tokens[0]);a.literal = !!a.literal;a.constant = !!a.constant;return a;},primary:function primary(){var a;this.expect("(")?(a = this.filterChain(),this.consume(")")):this.expect("[")?a = this.arrayDeclaration():this.expect("{")?a = this.object():this.peek().identifier && this.peek().text in mb?a = mb[this.consume().text]:this.peek().identifier?a = this.identifier():this.peek().constant?a = this.constant():this.throwError("not a primary expression",this.peek());for(var c,d;c = this.expect("(","[",".");) "(" === c.text?(a = this.functionCall(a,d),d = null):"[" === c.text?(d = a,a = this.objectIndex(a)):"." === c.text?(d = a,a = this.fieldAccess(a)):this.throwError("IMPOSSIBLE");return a;},throwError:function throwError(a,c){throw na("syntax",c.text,a,c.index + 1,this.text,this.text.substring(c.index));},peekToken:function peekToken(){if(0 === this.tokens.length)throw na("ueoe",this.text);return this.tokens[0];},peek:function peek(a,c,d,e){return this.peekAhead(0,a,c,d,e);},peekAhead:function peekAhead(a,c,d,e,f){if(this.tokens.length > a){a = this.tokens[a];var g=a.text;if(g === c || g === d || g === e || g === f || !(c || d || e || f))return a;}return !1;},expect:function expect(a,c,d,e){return (a = this.peek(a,c,d,e))?(this.tokens.shift(),a):!1;},consume:function consume(a){if(0 === this.tokens.length)throw na("ueoe",this.text);var c=this.expect(a);c || this.throwError("is unexpected, expecting [" + a + "]",this.peek());return c;},unaryFn:function unaryFn(a,c){var d=nb[a];return w(function(a,f){return d(a,f,c);},{constant:c.constant,inputs:[c]});},binaryFn:function binaryFn(a,c,d,e){var f=nb[c];return w(function(c,e){return f(c,e,a,d);},{constant:a.constant && d.constant,inputs:!e && [a,d]});},identifier:function identifier(){for(var a=this.consume().text;this.peek(".") && this.peekAhead(1).identifier && !this.peekAhead(2,"(");) a += this.consume().text + this.consume().text;return zf(a,this.options,this.text);},constant:function constant(){var a=this.consume().value;return w(function(){return a;},{constant:!0,literal:!0});},statements:function statements(){for(var a=[];;) if((0 < this.tokens.length && !this.peek("}",")",";","]") && a.push(this.filterChain()),!this.expect(";")))return 1 === a.length?a[0]:function(c,d){for(var e,f=0,g=a.length;f < g;f++) e = a[f](c,d);return e;};},filterChain:function filterChain(){for(var a=this.expression();this.expect("|");) a = this.filter(a);return a;},filter:function filter(a){var c=this.$filter(this.consume().text),d,e;if(this.peek(":"))for(d = [],e = [];this.expect(":");) d.push(this.expression());var f=[a].concat(d || []);return w(function(f,h){var l=a(f,h);if(e){e[0] = l;for(l = d.length;l--;) e[l + 1] = d[l](f,h);return c.apply(t,e);}return c(l);},{constant:!c.$stateful && f.every(fc),inputs:!c.$stateful && f});},expression:function expression(){return this.assignment();},assignment:function assignment(){var a=this.ternary(),c,d;return (d = this.expect("="))?(a.assign || this.throwError("implies assignment but [" + this.text.substring(0,d.index) + "] can not be assigned to",d),c = this.ternary(),w(function(d,f){return a.assign(d,c(d,f),f);},{inputs:[a,c]})):a;},ternary:function ternary(){var a=this.logicalOR(),c;if(this.expect("?") && (c = this.assignment(),this.consume(":"))){var d=this.assignment();return w(function(e,f){return a(e,f)?c(e,f):d(e,f);},{constant:a.constant && c.constant && d.constant});}return a;},logicalOR:function logicalOR(){for(var a=this.logicalAND(),c;c = this.expect("||");) a = this.binaryFn(a,c.text,this.logicalAND(),!0);return a;},logicalAND:function logicalAND(){for(var a=this.equality(),c;c = this.expect("&&");) a = this.binaryFn(a,c.text,this.equality(),!0);return a;},equality:function equality(){for(var a=this.relational(),c;c = this.expect("==","!=","===","!==");) a = this.binaryFn(a,c.text,this.relational());return a;},relational:function relational(){for(var a=this.additive(),c;c = this.expect("<",">","<=",">=");) a = this.binaryFn(a,c.text,this.additive());return a;},additive:function additive(){for(var a=this.multiplicative(),c;c = this.expect("+","-");) a = this.binaryFn(a,c.text,this.multiplicative());return a;},multiplicative:function multiplicative(){for(var a=this.unary(),c;c = this.expect("*","/","%");) a = this.binaryFn(a,c.text,this.unary());return a;},unary:function unary(){var a;return this.expect("+")?this.primary():(a = this.expect("-"))?this.binaryFn(ib.ZERO,a.text,this.unary()):(a = this.expect("!"))?this.unaryFn(a.text,this.unary()):this.primary();},fieldAccess:function fieldAccess(a){var c=this.identifier();return w(function(d,e,f){d = f || a(d,e);return null == d?t:c(d);},{assign:function assign(d,e,f){var g=a(d,f);g || a.assign(d,g = {},f);return c.assign(g,e);}});},objectIndex:function objectIndex(a){var c=this.text,d=this.expression();this.consume("]");return w(function(e,f){var g=a(e,f),h=d(e,f);ua(h,c);return g?oa(g[h],c):t;},{assign:function assign(e,f,g){var h=ua(d(e,g),c),l=oa(a(e,g),c);l || a.assign(e,l = {},g);return l[h] = f;}});},functionCall:function functionCall(a,c){var d=[];if(")" !== this.peekToken().text){do d.push(this.expression());while(this.expect(","));}this.consume(")");var e=this.text,f=d.length?[]:null;return function(g,h){var l=c?c(g,h):y(c)?t:g,k=a(g,h,l) || E;if(f)for(var n=d.length;n--;) f[n] = oa(d[n](g,h),e);oa(l,e);if(k){if(k.constructor === k)throw na("isecfn",e);if(k === Wf || k === Xf || k === Yf)throw na("isecff",e);}l = k.apply?k.apply(l,f):k(f[0],f[1],f[2],f[3],f[4]);f && (f.length = 0);return oa(l,e);};},arrayDeclaration:function arrayDeclaration(){var a=[];if("]" !== this.peekToken().text){do {if(this.peek("]"))break;a.push(this.expression());}while(this.expect(","));}this.consume("]");return w(function(c,d){for(var e=[],f=0,g=a.length;f < g;f++) e.push(a[f](c,d));return e;},{literal:!0,constant:a.every(fc),inputs:a});},object:function object(){var a=[],c=[];if("}" !== this.peekToken().text){do {if(this.peek("}"))break;var d=this.consume();d.constant?a.push(d.value):d.identifier?a.push(d.text):this.throwError("invalid key",d);this.consume(":");c.push(this.expression());}while(this.expect(","));}this.consume("}");return w(function(d,f){for(var g={},h=0,l=c.length;h < l;h++) g[a[h]] = c[h](d,f);return g;},{literal:!0,constant:c.every(fc),inputs:c});}};var Bf=ia(),Af=ia(),Cf=Object.prototype.valueOf,Ba=R("$sce"),pa={HTML:"html",CSS:"css",URL:"url",RESOURCE_URL:"resourceUrl",JS:"js"},la=R("$compile"),$=W.createElement("a"),id=Aa(Q.location.href);Fc.$inject = ["$provide"];jd.$inject = ["$locale"];ld.$inject = ["$locale"];var od=".",Mf={yyyy:U("FullYear",4),yy:U("FullYear",2,0,!0),y:U("FullYear",1),MMMM:Jb("Month"),MMM:Jb("Month",!0),MM:U("Month",2,1),M:U("Month",1,1),dd:U("Date",2),d:U("Date",1),HH:U("Hours",2),H:U("Hours",1),hh:U("Hours",2,-12),h:U("Hours",1,-12),mm:U("Minutes",2),m:U("Minutes",1),ss:U("Seconds",2),s:U("Seconds",1),sss:U("Milliseconds",3),EEEE:Jb("Day"),EEE:Jb("Day",!0),a:(function(_a){function a(_x3,_x4){return _a.apply(this,arguments);}a.toString = function(){return _a.toString();};return a;})(function(a,c){return 12 > a.getHours()?c.AMPMS[0]:c.AMPMS[1];}),Z:function Z(a){a = -1 * a.getTimezoneOffset();return a = (0 <= a?"+":"") + (Ib(Math[0 < a?"floor":"ceil"](a / 60),2) + Ib(Math.abs(a % 60),2));},ww:qd(2),w:qd(1),G:ic,GG:ic,GGG:ic,GGGG:function GGGG(a,c){return 0 >= a.getFullYear()?c.ERANAMES[0]:c.ERANAMES[1];}},Lf=/((?:[^yMdHhmsaZEwG']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z|G+|w+))(.*)/,Kf=/^\-?\d+$/;kd.$inject = ["$locale"];var Hf=ea(z),If=ea(ub);md.$inject = ["$parse"];var Td=ea({restrict:"E",compile:function compile(a,c){if(!c.href && !c.xlinkHref && !c.name)return function(a,c){if("a" === c[0].nodeName.toLowerCase()){var f="[object SVGAnimatedString]" === Ca.call(c.prop("href"))?"xlink:href":"href";c.on("click",function(a){c.attr(f) || a.preventDefault();});}};}}),vb={};r(Eb,function(a,c){if("multiple" != a){var d=xa("ng-" + c);vb[d] = function(){return {restrict:"A",priority:100,link:function link(a,f,g){a.$watch(g[d],function(a){g.$set(c,!!a);});}};};}});r(Pc,function(a,c){vb[c] = function(){return {priority:100,link:function link(a,e,f){if("ngPattern" === c && "/" == f.ngPattern.charAt(0) && (e = f.ngPattern.match(Of))){f.$set("ngPattern",new RegExp(e[1],e[2]));return;}a.$watch(f[c],function(a){f.$set(c,a);});}};};});r(["src","srcset","href"],function(a){var c=xa("ng-" + a);vb[c] = function(){return {priority:99,link:function link(d,e,f){var g=a,h=a;"href" === a && "[object SVGAnimatedString]" === Ca.call(e.prop("href")) && (h = "xlinkHref",f.$attr[h] = "xlink:href",g = null);f.$observe(c,function(c){c?(f.$set(h,c),Qa && g && e.prop(g,f[h])):"href" === a && f.$set(h,null);});}};};});var Kb={$addControl:E,$$renameControl:function $$renameControl(a,c){a.$name = c;},$removeControl:E,$setValidity:E,$setDirty:E,$setPristine:E,$setSubmitted:E};rd.$inject = ["$element","$attrs","$scope","$animate","$interpolate"];var yd=function yd(a){return ["$timeout",function(c){return {name:"form",restrict:a?"EAC":"E",controller:rd,compile:function compile(d,e){d.addClass(Ra).addClass(lb);var f=e.name?"name":a && e.ngForm?"ngForm":!1;return {pre:function pre(a,d,e,k){if(!("action" in e)){var n=function n(c){a.$apply(function(){k.$commitViewValue();k.$setSubmitted();});c.preventDefault();};d[0].addEventListener("submit",n,!1);d.on("$destroy",function(){c(function(){d[0].removeEventListener("submit",n,!1);},0,!1);});}var p=k.$$parentForm;f && (hb(a,null,k.$name,k,k.$name),e.$observe(f,function(c){k.$name !== c && (hb(a,null,k.$name,t,k.$name),p.$$renameControl(k,c),hb(a,null,k.$name,k,k.$name));}));d.on("$destroy",function(){p.$removeControl(k);f && hb(a,null,e[f],t,k.$name);w(k,Kb);});}};}};}];},Ud=yd(),ge=yd(!0),Nf=/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/,$f=/^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/,ag=/^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i,bg=/^\s*(\-|\+)?(\d+|(\d*(\.\d*)))\s*$/,zd=/^(\d{4})-(\d{2})-(\d{2})$/,Ad=/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)(?::(\d\d)(\.\d{1,3})?)?$/,lc=/^(\d{4})-W(\d\d)$/,Bd=/^(\d{4})-(\d\d)$/,Cd=/^(\d\d):(\d\d)(?::(\d\d)(\.\d{1,3})?)?$/,Dd={text:function text(a,c,d,e,f,g){jb(a,c,d,e,f,g);jc(e);},date:kb("date",zd,Mb(zd,["yyyy","MM","dd"]),"yyyy-MM-dd"),"datetime-local":kb("datetimelocal",Ad,Mb(Ad,"yyyy MM dd HH mm ss sss".split(" ")),"yyyy-MM-ddTHH:mm:ss.sss"),time:kb("time",Cd,Mb(Cd,["HH","mm","ss","sss"]),"HH:mm:ss.sss"),week:kb("week",lc,function(a,c){if(ga(a))return a;if(C(a)){lc.lastIndex = 0;var d=lc.exec(a);if(d){var e=+d[1],f=+d[2],g=d = 0,h=0,l=0,k=pd(e),f=7 * (f - 1);c && (d = c.getHours(),g = c.getMinutes(),h = c.getSeconds(),l = c.getMilliseconds());return new Date(e,0,k.getDate() + f,d,g,h,l);}}return NaN;},"yyyy-Www"),month:kb("month",Bd,Mb(Bd,["yyyy","MM"]),"yyyy-MM"),number:function number(a,c,d,e,f,g){td(a,c,d,e);jb(a,c,d,e,f,g);e.$$parserName = "number";e.$parsers.push(function(a){return e.$isEmpty(a)?null:bg.test(a)?parseFloat(a):t;});e.$formatters.push(function(a){if(!e.$isEmpty(a)){if(!Y(a))throw Nb("numfmt",a);a = a.toString();}return a;});if(y(d.min) || d.ngMin){var h;e.$validators.min = function(a){return e.$isEmpty(a) || x(h) || a >= h;};d.$observe("min",function(a){y(a) && !Y(a) && (a = parseFloat(a,10));h = Y(a) && !isNaN(a)?a:t;e.$validate();});}if(y(d.max) || d.ngMax){var l;e.$validators.max = function(a){return e.$isEmpty(a) || x(l) || a <= l;};d.$observe("max",function(a){y(a) && !Y(a) && (a = parseFloat(a,10));l = Y(a) && !isNaN(a)?a:t;e.$validate();});}},url:function url(a,c,d,e,f,g){jb(a,c,d,e,f,g);jc(e);e.$$parserName = "url";e.$validators.url = function(a,c){var d=a || c;return e.$isEmpty(d) || $f.test(d);};},email:function email(a,c,d,e,f,g){jb(a,c,d,e,f,g);jc(e);e.$$parserName = "email";e.$validators.email = function(a,c){var d=a || c;return e.$isEmpty(d) || ag.test(d);};},radio:function radio(a,c,d,e){x(d.name) && c.attr("name",++ob);c.on("click",function(a){c[0].checked && e.$setViewValue(d.value,a && a.type);});e.$render = function(){c[0].checked = d.value == e.$viewValue;};d.$observe("value",e.$render);},checkbox:function checkbox(a,c,d,e,f,g,h,l){var k=ud(l,a,"ngTrueValue",d.ngTrueValue,!0),n=ud(l,a,"ngFalseValue",d.ngFalseValue,!1);c.on("click",function(a){e.$setViewValue(c[0].checked,a && a.type);});e.$render = function(){c[0].checked = e.$viewValue;};e.$isEmpty = function(a){return !1 === a;};e.$formatters.push(function(a){return ha(a,k);});e.$parsers.push(function(a){return a?k:n;});},hidden:E,button:E,submit:E,reset:E,file:E},zc=["$browser","$sniffer","$filter","$parse",function(a,c,d,e){return {restrict:"E",require:["?ngModel"],link:{pre:function pre(f,g,h,l){l[0] && (Dd[z(h.type)] || Dd.text)(f,g,h,l[0],c,a,d,e);}}};}],cg=/^(true|false|\d+)$/,ye=function ye(){return {restrict:"A",priority:100,compile:function compile(a,c){return cg.test(c.ngValue)?function(a,c,f){f.$set("value",a.$eval(f.ngValue));}:function(a,c,f){a.$watch(f.ngValue,function(a){f.$set("value",a);});};}};},Zd=["$compile",function(a){return {restrict:"AC",compile:function compile(c){a.$$addBindingClass(c);return function(c,e,f){a.$$addBindingInfo(e,f.ngBind);e = e[0];c.$watch(f.ngBind,function(a){e.textContent = a === t?"":a;});};}};}],ae=["$interpolate","$compile",function(a,c){return {compile:function compile(d){c.$$addBindingClass(d);return function(d,f,g){d = a(f.attr(g.$attr.ngBindTemplate));c.$$addBindingInfo(f,d.expressions);f = f[0];g.$observe("ngBindTemplate",function(a){f.textContent = a === t?"":a;});};}};}],$d=["$sce","$parse","$compile",function(a,c,d){return {restrict:"A",compile:function compile(e,f){var g=c(f.ngBindHtml),h=c(f.ngBindHtml,function(a){return (a || "").toString();});d.$$addBindingClass(e);return function(c,e,f){d.$$addBindingInfo(e,f.ngBindHtml);c.$watch(h,function(){e.html(a.getTrustedHtml(g(c)) || "");});};}};}],xe=ea({restrict:"A",require:"ngModel",link:function link(a,c,d,e){e.$viewChangeListeners.push(function(){a.$eval(d.ngChange);});}}),be=kc("",!0),de=kc("Odd",0),ce=kc("Even",1),ee=Ia({compile:function compile(a,c){c.$set("ngCloak",t);a.removeClass("ng-cloak");}}),fe=[function(){return {restrict:"A",scope:!0,controller:"@",priority:500};}],Ec={},dg={blur:!0,focus:!0};r("click dblclick mousedown mouseup mouseover mouseout mousemove mouseenter mouseleave keydown keyup keypress submit focus blur copy cut paste".split(" "),function(a){var c=xa("ng-" + a);Ec[c] = ["$parse","$rootScope",function(d,e){return {restrict:"A",compile:function compile(f,g){var h=d(g[c],null,!0);return function(c,d){d.on(a,function(d){var f=function f(){h(c,{$event:d});};dg[a] && e.$$phase?c.$evalAsync(f):c.$apply(f);});};}};}];});var ie=["$animate",function(a){return {multiElement:!0,transclude:"element",priority:600,terminal:!0,restrict:"A",$$tlb:!0,link:function link(c,d,e,f,g){var h,l,k;c.$watch(e.ngIf,function(c){c?l || g(function(c,f){l = f;c[c.length++] = W.createComment(" end ngIf: " + e.ngIf + " ");h = {clone:c};a.enter(c,d.parent(),d);}):(k && (k.remove(),k = null),l && (l.$destroy(),l = null),h && (k = tb(h.clone),a.leave(k).then(function(){k = null;}),h = null));});}};}],je=["$templateRequest","$anchorScroll","$animate","$sce",function(a,c,d,e){return {restrict:"ECA",priority:400,terminal:!0,transclude:"element",controller:ca.noop,compile:function compile(f,g){var h=g.ngInclude || g.src,l=g.onload || "",k=g.autoscroll;return function(f,g,q,r,s){var t=0,v,m,F,w=function w(){m && (m.remove(),m = null);v && (v.$destroy(),v = null);F && (d.leave(F).then(function(){m = null;}),m = F,F = null);};f.$watch(e.parseAsResourceUrl(h),function(e){var h=function h(){!y(k) || k && !f.$eval(k) || c();},m=++t;e?(a(e,!0).then(function(a){if(m === t){var c=f.$new();r.template = a;a = s(c,function(a){w();d.enter(a,null,g).then(h);});v = c;F = a;v.$emit("$includeContentLoaded",e);f.$eval(l);}},function(){m === t && (w(),f.$emit("$includeContentError",e));}),f.$emit("$includeContentRequested",e)):(w(),r.template = null);});};}};}],Ae=["$compile",function(a){return {restrict:"ECA",priority:-400,require:"ngInclude",link:function link(c,d,e,f){/SVG/.test(d[0].toString())?(d.empty(),a(Hc(f.template,W).childNodes)(c,function(a){d.append(a);},{futureParentElement:d})):(d.html(f.template),a(d.contents())(c));}};}],ke=Ia({priority:450,compile:function compile(){return {pre:function pre(a,c,d){a.$eval(d.ngInit);}};}}),we=function we(){return {restrict:"A",priority:100,require:"ngModel",link:function link(a,c,d,e){var f=c.attr(d.$attr.ngList) || ", ",g="false" !== d.ngTrim,h=g?N(f):f;e.$parsers.push(function(a){if(!x(a)){var c=[];a && r(a.split(h),function(a){a && c.push(g?N(a):a);});return c;}});e.$formatters.push(function(a){return H(a)?a.join(f):t;});e.$isEmpty = function(a){return !a || !a.length;};}};},lb="ng-valid",vd="ng-invalid",Ra="ng-pristine",Lb="ng-dirty",xd="ng-pending",Nb=new R("ngModel"),eg=["$scope","$exceptionHandler","$attrs","$element","$parse","$animate","$timeout","$rootScope","$q","$interpolate",function(a,c,d,e,f,g,h,l,k,n){this.$modelValue = this.$viewValue = Number.NaN;this.$$rawModelValue = t;this.$validators = {};this.$asyncValidators = {};this.$parsers = [];this.$formatters = [];this.$viewChangeListeners = [];this.$untouched = !0;this.$touched = !1;this.$pristine = !0;this.$dirty = !1;this.$valid = !0;this.$invalid = !1;this.$error = {};this.$$success = {};this.$pending = t;this.$name = n(d.name || "",!1)(a);var p=f(d.ngModel),q=p.assign,u=p,s=q,M=null,v,m=this;this.$$setOptions = function(a){if((m.$options = a) && a.getterSetter){var c=f(d.ngModel + "()"),g=f(d.ngModel + "($$$p)");u = function(a){var d=p(a);G(d) && (d = c(a));return d;};s = function(a,c){G(p(a))?g(a,{$$$p:m.$modelValue}):q(a,m.$modelValue);};}else if(!p.assign)throw Nb("nonassign",d.ngModel,wa(e));};this.$render = E;this.$isEmpty = function(a){return x(a) || "" === a || null === a || a !== a;};var F=e.inheritedData("$formController") || Kb,w=0;sd({ctrl:this,$element:e,set:function set(a,c){a[c] = !0;},unset:function unset(a,c){delete a[c];},parentForm:F,$animate:g});this.$setPristine = function(){m.$dirty = !1;m.$pristine = !0;g.removeClass(e,Lb);g.addClass(e,Ra);};this.$setDirty = function(){m.$dirty = !0;m.$pristine = !1;g.removeClass(e,Ra);g.addClass(e,Lb);F.$setDirty();};this.$setUntouched = function(){m.$touched = !1;m.$untouched = !0;g.setClass(e,"ng-untouched","ng-touched");};this.$setTouched = function(){m.$touched = !0;m.$untouched = !1;g.setClass(e,"ng-touched","ng-untouched");};this.$rollbackViewValue = function(){h.cancel(M);m.$viewValue = m.$$lastCommittedViewValue;m.$render();};this.$validate = function(){if(!Y(m.$modelValue) || !isNaN(m.$modelValue)){var a=m.$$rawModelValue,c=m.$valid,d=m.$modelValue,e=m.$options && m.$options.allowInvalid;m.$$runValidators(a,m.$$lastCommittedViewValue,function(f){e || c === f || (m.$modelValue = f?a:t,m.$modelValue !== d && m.$$writeModelToScope());});}};this.$$runValidators = function(a,c,d){function e(){var d=!0;r(m.$validators,function(e,f){var h=e(a,c);d = d && h;g(f,h);});return d?!0:(r(m.$asyncValidators,function(a,c){g(c,null);}),!1);}function f(){var d=[],e=!0;r(m.$asyncValidators,function(f,h){var k=f(a,c);if(!k || !G(k.then))throw Nb("$asyncValidators",k);g(h,t);d.push(k.then(function(){g(h,!0);},function(a){e = !1;g(h,!1);}));});d.length?k.all(d).then(function(){h(e);},E):h(!0);}function g(a,c){l === w && m.$setValidity(a,c);}function h(a){l === w && d(a);}w++;var l=w;(function(){var a=m.$$parserName || "parse";if(v === t)g(a,null);else return (v || (r(m.$validators,function(a,c){g(c,null);}),r(m.$asyncValidators,function(a,c){g(c,null);})),g(a,v),v);return !0;})()?e()?f():h(!1):h(!1);};this.$commitViewValue = function(){var a=m.$viewValue;h.cancel(M);if(m.$$lastCommittedViewValue !== a || "" === a && m.$$hasNativeValidators)m.$$lastCommittedViewValue = a,m.$pristine && this.$setDirty(),this.$$parseAndValidate();};this.$$parseAndValidate = function(){var c=m.$$lastCommittedViewValue;if(v = x(c)?t:!0)for(var d=0;d < m.$parsers.length;d++) if((c = m.$parsers[d](c),x(c))){v = !1;break;}Y(m.$modelValue) && isNaN(m.$modelValue) && (m.$modelValue = u(a));var e=m.$modelValue,f=m.$options && m.$options.allowInvalid;m.$$rawModelValue = c;f && (m.$modelValue = c,m.$modelValue !== e && m.$$writeModelToScope());m.$$runValidators(c,m.$$lastCommittedViewValue,function(a){f || (m.$modelValue = a?c:t,m.$modelValue !== e && m.$$writeModelToScope());});};this.$$writeModelToScope = function(){s(a,m.$modelValue);r(m.$viewChangeListeners,function(a){try{a();}catch(d) {c(d);}});};this.$setViewValue = function(a,c){m.$viewValue = a;m.$options && !m.$options.updateOnDefault || m.$$debounceViewValueCommit(c);};this.$$debounceViewValueCommit = function(c){var d=0,e=m.$options;e && y(e.debounce) && (e = e.debounce,Y(e)?d = e:Y(e[c])?d = e[c]:Y(e["default"]) && (d = e["default"]));h.cancel(M);d?M = h(function(){m.$commitViewValue();},d):l.$$phase?m.$commitViewValue():a.$apply(function(){m.$commitViewValue();});};a.$watch(function(){var c=u(a);if(c !== m.$modelValue){m.$modelValue = m.$$rawModelValue = c;v = t;for(var d=m.$formatters,e=d.length,f=c;e--;) f = d[e](f);m.$viewValue !== f && (m.$viewValue = m.$$lastCommittedViewValue = f,m.$render(),m.$$runValidators(c,f,E));}return c;});}],ve=["$rootScope",function(a){return {restrict:"A",require:["ngModel","^?form","^?ngModelOptions"],controller:eg,priority:1,compile:function compile(c){c.addClass(Ra).addClass("ng-untouched").addClass(lb);return {pre:function pre(a,c,f,g){var h=g[0],l=g[1] || Kb;h.$$setOptions(g[2] && g[2].$options);l.$addControl(h);f.$observe("name",function(a){h.$name !== a && l.$$renameControl(h,a);});a.$on("$destroy",function(){l.$removeControl(h);});},post:function post(c,e,f,g){var h=g[0];if(h.$options && h.$options.updateOn)e.on(h.$options.updateOn,function(a){h.$$debounceViewValueCommit(a && a.type);});e.on("blur",function(e){h.$touched || (a.$$phase?c.$evalAsync(h.$setTouched):c.$apply(h.$setTouched));});}};}};}],fg=/(\s+|^)default(\s+|$)/,ze=function ze(){return {restrict:"A",controller:["$scope","$attrs",function(a,c){var d=this;this.$options = a.$eval(c.ngModelOptions);this.$options.updateOn !== t?(this.$options.updateOnDefault = !1,this.$options.updateOn = N(this.$options.updateOn.replace(fg,function(){d.$options.updateOnDefault = !0;return " ";}))):this.$options.updateOnDefault = !0;}]};},le=Ia({terminal:!0,priority:1E3}),me=["$locale","$interpolate",function(a,c){var d=/{}/g,e=/^when(Minus)?(.+)$/;return {restrict:"EA",link:function link(f,g,h){function l(a){g.text(a || "");}var k=h.count,n=h.$attr.when && g.attr(h.$attr.when),p=h.offset || 0,q=f.$eval(n) || {},u={},n=c.startSymbol(),s=c.endSymbol(),t=n + k + "-" + p + s,v=ca.noop,m;r(h,function(a,c){var d=e.exec(c);d && (d = (d[1]?"-":"") + z(d[2]),q[d] = g.attr(h.$attr[c]));});r(q,function(a,e){u[e] = c(a.replace(d,t));});f.$watch(k,function(c){c = parseFloat(c);var d=isNaN(c);d || c in q || (c = a.pluralCat(c - p));c === m || d && isNaN(m) || (v(),v = f.$watch(u[c],l),m = c);});}};}],ne=["$parse","$animate",function(a,c){var d=R("ngRepeat"),e=(function(_e){function e(_x5,_x6,_x7,_x8,_x9,_x10,_x11){return _e.apply(this,arguments);}e.toString = function(){return _e.toString();};return e;})(function(a,c,d,e,k,n,p){a[d] = e;k && (a[k] = n);a.$index = c;a.$first = 0 === c;a.$last = c === p - 1;a.$middle = !(a.$first || a.$last);a.$odd = !(a.$even = 0 === (c & 1));});return {restrict:"A",multiElement:!0,transclude:"element",priority:1E3,terminal:!0,$$tlb:!0,compile:function compile(f,g){var h=g.ngRepeat,l=W.createComment(" end ngRepeat: " + h + " "),k=h.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);if(!k)throw d("iexp",h);var n=k[1],p=k[2],q=k[3],u=k[4],k=n.match(/^(?:(\s*[\$\w]+)|\(\s*([\$\w]+)\s*,\s*([\$\w]+)\s*\))$/);if(!k)throw d("iidexp",n);var s=k[3] || k[1],y=k[2];if(q && (!/^[$a-zA-Z_][$a-zA-Z0-9_]*$/.test(q) || /^(null|undefined|this|\$index|\$first|\$middle|\$last|\$even|\$odd|\$parent|\$root|\$id)$/.test(q)))throw d("badident",q);var v,m,w,x,E={$id:Ma};u?v = a(u):(w = function(a,c){return Ma(c);},x = function(a){return a;});return function(a,f,g,k,n){v && (m = function(c,d,e){y && (E[y] = c);E[s] = d;E.$index = e;return v(a,E);});var u=ia();a.$watchCollection(p,function(g){var k,p,v=f[0],D,E=ia(),G,H,L,S,J,C,z;q && (a[q] = g);if(Sa(g))J = g,p = m || w;else {p = m || x;J = [];for(z in g) g.hasOwnProperty(z) && "$" != z.charAt(0) && J.push(z);J.sort();}G = J.length;z = Array(G);for(k = 0;k < G;k++) if((H = g === J?k:J[k],L = g[H],S = p(H,L,k),u[S]))C = u[S],delete u[S],E[S] = C,z[k] = C;else {if(E[S])throw (r(z,function(a){a && a.scope && (u[a.id] = a);}),d("dupes",h,S,L));z[k] = {id:S,scope:t,clone:t};E[S] = !0;}for(D in u) {C = u[D];S = tb(C.clone);c.leave(S);if(S[0].parentNode)for(k = 0,p = S.length;k < p;k++) S[k].$$NG_REMOVED = !0;C.scope.$destroy();}for(k = 0;k < G;k++) if((H = g === J?k:J[k],L = g[H],C = z[k],C.scope)){D = v;do D = D.nextSibling;while(D && D.$$NG_REMOVED);C.clone[0] != D && c.move(tb(C.clone),null,A(v));v = C.clone[C.clone.length - 1];e(C.scope,k,s,L,y,H,G);}else n(function(a,d){C.scope = d;var f=l.cloneNode(!1);a[a.length++] = f;c.enter(a,null,A(v));v = f;C.clone = a;E[C.id] = C;e(C.scope,k,s,L,y,H,G);});u = E;});};}};}],oe=["$animate",function(a){return {restrict:"A",multiElement:!0,link:function link(c,d,e){c.$watch(e.ngShow,function(c){a[c?"removeClass":"addClass"](d,"ng-hide",{tempClasses:"ng-hide-animate"});});}};}],he=["$animate",function(a){return {restrict:"A",multiElement:!0,link:function link(c,d,e){c.$watch(e.ngHide,function(c){a[c?"addClass":"removeClass"](d,"ng-hide",{tempClasses:"ng-hide-animate"});});}};}],pe=Ia(function(a,c,d){a.$watchCollection(d.ngStyle,function(a,d){d && a !== d && r(d,function(a,d){c.css(d,"");});a && c.css(a);});}),qe=["$animate",function(a){return {restrict:"EA",require:"ngSwitch",controller:["$scope",function(){this.cases = {};}],link:function link(c,d,e,f){var g=[],h=[],l=[],k=[],n=function n(a,c){return function(){a.splice(c,1);};};c.$watch(e.ngSwitch || e.on,function(c){var d,e;d = 0;for(e = l.length;d < e;++d) a.cancel(l[d]);d = l.length = 0;for(e = k.length;d < e;++d) {var s=tb(h[d].clone);k[d].$destroy();(l[d] = a.leave(s)).then(n(l,d));}h.length = 0;k.length = 0;(g = f.cases["!" + c] || f.cases["?"]) && r(g,function(c){c.transclude(function(d,e){k.push(e);var f=c.element;d[d.length++] = W.createComment(" end ngSwitchWhen: ");h.push({clone:d});a.enter(d,f.parent(),f);});});});}};}],re=Ia({transclude:"element",priority:1200,require:"^ngSwitch",multiElement:!0,link:function link(a,c,d,e,f){e.cases["!" + d.ngSwitchWhen] = e.cases["!" + d.ngSwitchWhen] || [];e.cases["!" + d.ngSwitchWhen].push({transclude:f,element:c});}}),se=Ia({transclude:"element",priority:1200,require:"^ngSwitch",multiElement:!0,link:function link(a,c,d,e,f){e.cases["?"] = e.cases["?"] || [];e.cases["?"].push({transclude:f,element:c});}}),ue=Ia({restrict:"EAC",link:function link(a,c,d,e,f){if(!f)throw R("ngTransclude")("orphan",wa(c));f(function(a){c.empty();c.append(a);});}}),Vd=["$templateCache",function(a){return {restrict:"E",terminal:!0,compile:function compile(c,d){"text/ng-template" == d.type && a.put(d.id,c[0].text);}};}],gg=R("ngOptions"),te=ea({restrict:"A",terminal:!0}),Wd=["$compile","$parse",function(a,c){var d=/^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/,e={$setViewValue:E};return {restrict:"E",require:["select","?ngModel"],controller:["$element","$scope","$attrs",function(a,c,d){var l=this,k={},n=e,p;l.databound = d.ngModel;l.init = function(a,c,d){n = a;p = d;};l.addOption = function(c,d){La(c,"\"option value\"");k[c] = !0;n.$viewValue == c && (a.val(c),p.parent() && p.remove());d && d[0].hasAttribute("selected") && (d[0].selected = !0);};l.removeOption = function(a){this.hasOption(a) && (delete k[a],n.$viewValue === a && this.renderUnknownOption(a));};l.renderUnknownOption = function(c){c = "? " + Ma(c) + " ?";p.val(c);a.prepend(p);a.val(c);p.prop("selected",!0);};l.hasOption = function(a){return k.hasOwnProperty(a);};c.$on("$destroy",function(){l.renderUnknownOption = E;});}],link:function link(e,g,h,l){function k(a,c,d,e){d.$render = function(){var a=d.$viewValue;e.hasOption(a)?(C.parent() && C.remove(),c.val(a),"" === a && v.prop("selected",!0)):x(a) && v?c.val(""):e.renderUnknownOption(a);};c.on("change",function(){a.$apply(function(){C.parent() && C.remove();d.$setViewValue(c.val());});});}function n(a,c,d){var e;d.$render = function(){var a=new eb(d.$viewValue);r(c.find("option"),function(c){c.selected = y(a.get(c.value));});};a.$watch(function(){ha(e,d.$viewValue) || (e = sa(d.$viewValue),d.$render());});c.on("change",function(){a.$apply(function(){var a=[];r(c.find("option"),function(c){c.selected && a.push(c.value);});d.$setViewValue(a);});});}function p(e,f,g){function h(a,c,d){T[x] = d;G && (T[G] = c);return a(e,T);}function k(a){var c;if(u)if(I && H(a)){c = new eb([]);for(var d=0;d < a.length;d++) c.put(h(I,null,a[d]),!0);}else c = new eb(a);else I && (a = h(I,null,a));return function(d,e){var f;f = I?I:B?B:z;return u?y(c.remove(h(f,d,e))):a === h(f,d,e);};}function l(){m || (e.$$postDigest(p),m = !0);}function n(a,c,d){a[c] = a[c] || 0;a[c] += d?1:-1;}function p(){m = !1;var a={"":[]},c=[""],d,l,s,t,v;s = g.$viewValue;t = L(e) || [];var B=G?Object.keys(t).sort():t,x,A,H,z,O={};v = k(s);var N=!1,U,W;Q = {};for(z = 0;H = B.length,z < H;z++) {x = z;if(G && (x = B[z],"$" === x.charAt(0)))continue;A = t[x];d = h(J,x,A) || "";(l = a[d]) || (l = a[d] = [],c.push(d));d = v(x,A);N = N || d;A = h(C,x,A);A = y(A)?A:"";W = I?I(e,T):G?B[z]:z;I && (Q[W] = x);l.push({id:W,label:A,selected:d});}u || (w || null === s?a[""].unshift({id:"",label:"",selected:!N}):N || a[""].unshift({id:"?",label:"",selected:!0}));x = 0;for(B = c.length;x < B;x++) {d = c[x];l = a[d];R.length <= x?(s = {element:E.clone().attr("label",d),label:l.label},t = [s],R.push(t),f.append(s.element)):(t = R[x],s = t[0],s.label != d && s.element.attr("label",s.label = d));N = null;z = 0;for(H = l.length;z < H;z++) d = l[z],(v = t[z + 1])?(N = v.element,v.label !== d.label && (n(O,v.label,!1),n(O,d.label,!0),N.text(v.label = d.label),N.prop("label",v.label)),v.id !== d.id && N.val(v.id = d.id),N[0].selected !== d.selected && (N.prop("selected",v.selected = d.selected),Qa && N.prop("selected",v.selected))):("" === d.id && w?U = w:(U = F.clone()).val(d.id).prop("selected",d.selected).attr("selected",d.selected).prop("label",d.label).text(d.label),t.push(v = {element:U,label:d.label,id:d.id,selected:d.selected}),n(O,d.label,!0),N?N.after(U):s.element.append(U),N = U);for(z++;t.length > z;) d = t.pop(),n(O,d.label,!1),d.element.remove();}for(;R.length > x;) {l = R.pop();for(z = 1;z < l.length;++z) n(O,l[z].label,!1);l[0].element.remove();}r(O,function(a,c){0 < a?q.addOption(c):0 > a && q.removeOption(c);});}var v;if(!(v = s.match(d)))throw gg("iexp",s,wa(f));var C=c(v[2] || v[1]),x=v[4] || v[6],A=/ as /.test(v[0]) && v[1],B=A?c(A):null,G=v[5],J=c(v[3] || ""),z=c(v[2]?v[1]:x),L=c(v[7]),I=v[8]?c(v[8]):null,Q={},R=[[{element:f,label:""}]],T={};w && (a(w)(e),w.removeClass("ng-scope"),w.remove());f.empty();f.on("change",function(){e.$apply(function(){var a=L(e) || [],c;if(u)c = [],r(f.val(),function(d){d = I?Q[d]:d;c.push("?" === d?t:"" === d?null:h(B?B:z,d,a[d]));});else {var d=I?Q[f.val()]:f.val();c = "?" === d?t:"" === d?null:h(B?B:z,d,a[d]);}g.$setViewValue(c);p();});});g.$render = p;e.$watchCollection(L,l);e.$watchCollection(function(){var a=L(e),c;if(a && H(a)){c = Array(a.length);for(var d=0,f=a.length;d < f;d++) c[d] = h(C,d,a[d]);}else if(a)for(d in (c = {},a)) a.hasOwnProperty(d) && (c[d] = h(C,d,a[d]));return c;},l);u && e.$watchCollection(function(){return g.$modelValue;},l);}if(l[1]){var q=l[0];l = l[1];var u=h.multiple,s=h.ngOptions,w=!1,v,m=!1,F=A(W.createElement("option")),E=A(W.createElement("optgroup")),C=F.clone();h = 0;for(var B=g.children(),G=B.length;h < G;h++) if("" === B[h].value){v = w = B.eq(h);break;}q.init(l,w,C);u && (l.$isEmpty = function(a){return !a || 0 === a.length;});s?p(e,g,l):u?n(e,g,l):k(e,g,l,q);}}};}],Yd=["$interpolate",function(a){var c={addOption:E,removeOption:E};return {restrict:"E",priority:100,compile:function compile(d,e){if(x(e.value)){var f=a(d.text(),!0);f || e.$set("value",d.text());}return function(a,d,e){var k=d.parent(),n=k.data("$selectController") || k.parent().data("$selectController");n && n.databound || (n = c);f?a.$watch(f,function(a,c){e.$set("value",a);c !== a && n.removeOption(c);n.addOption(a,d);}):n.addOption(e.value,d);d.on("$destroy",function(){n.removeOption(e.value);});};}};}],Xd=ea({restrict:"E",terminal:!1}),Bc=function Bc(){return {restrict:"A",require:"?ngModel",link:function link(a,c,d,e){e && (d.required = !0,e.$validators.required = function(a,c){return !d.required || !e.$isEmpty(c);},d.$observe("required",function(){e.$validate();}));}};},Ac=function Ac(){return {restrict:"A",require:"?ngModel",link:function link(a,c,d,e){if(e){var f,g=d.ngPattern || d.pattern;d.$observe("pattern",function(a){C(a) && 0 < a.length && (a = new RegExp("^" + a + "$"));if(a && !a.test)throw R("ngPattern")("noregexp",g,a,wa(c));f = a || t;e.$validate();});e.$validators.pattern = function(a){return e.$isEmpty(a) || x(f) || f.test(a);};}}};},Dc=function Dc(){return {restrict:"A",require:"?ngModel",link:function link(a,c,d,e){if(e){var f=-1;d.$observe("maxlength",function(a){a = aa(a);f = isNaN(a)?-1:a;e.$validate();});e.$validators.maxlength = function(a,c){return 0 > f || e.$isEmpty(c) || c.length <= f;};}}};},Cc=function Cc(){return {restrict:"A",require:"?ngModel",link:function link(a,c,d,e){if(e){var f=0;d.$observe("minlength",function(a){f = aa(a) || 0;e.$validate();});e.$validators.minlength = function(a,c){return e.$isEmpty(c) || c.length >= f;};}}};};Q.angular.bootstrap?console.log("WARNING: Tried to load angular more than once."):(Nd(),Pd(ca),A(W).ready(function(){Jd(W,uc);}));})(window,document);!window.angular.$$csp() && window.angular.element(document).find("head").prepend("<style type=\"text/css\">@charset \"UTF-8\";[ng\\:cloak],[ng-cloak],[data-ng-cloak],[x-ng-cloak],.ng-cloak,.x-ng-cloak,.ng-hide:not(.ng-hide-animate){display:none !important;}ng\\:form{display:block;}</style>");

; browserify_shim__define__module__export__(typeof angular != "undefined" ? angular : window.angular);

}).call(global, undefined, undefined, undefined, undefined, function defineExport(ex) { module.exports = ex; });

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/Users/REDLIST/Sites/fed-bingo/app/scripts/utils/index.js":[function(require,module,exports){
'use strict';
var $ = require('jquery');
var util = {
  calcHeight: function calcHeight(cssClass) {
    var $el = $('.' + cssClass);
    $el.show();
    var height = $el.height();
    $el.hide();
    return height;
  },
  fedWords: require('./wordlist.js'),
  generateArray: function generateArray(dataSet) {
    var arr = [];
    for (var i = 0; i < 25; i++) {
      var rand = Math.floor(Math.random() * dataSet.length);
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
  generateGuid: function generateGuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  },
  modalHide: function modalHide(cssClass) {
    $('.overlay').fadeOut();
    $('.' + cssClass).fadeOut();
    $('body').removeClass('modal-open');
  },
  modalShow: function modalShow(cssClass) {
    var $el = $('.' + cssClass);
    $el.css('margin-top', '-' + util.calcHeight(cssClass) / 2 + 'px');
    $('.overlay').fadeIn();
    $el.fadeIn();
    $('body').addClass('modal-open');
  },
  paulPhrases: require('./paul-phrases.js'),
  randomizer: function randomizer(dataSet) {
    var rand = Math.floor(Math.random() * dataSet.length);
    return dataSet[rand];
  },
  sortNumber: function sortNumber(a, b) {
    return a - b;
  },
  winningCombos: require('./winning-combos.js'),
  winningImages: require('./winning-images.js'),
  winningPhrases: require('./winning-phrases.js')
};

module.exports = util;

},{"./paul-phrases.js":"/Users/REDLIST/Sites/fed-bingo/app/scripts/utils/paul-phrases.js","./winning-combos.js":"/Users/REDLIST/Sites/fed-bingo/app/scripts/utils/winning-combos.js","./winning-images.js":"/Users/REDLIST/Sites/fed-bingo/app/scripts/utils/winning-images.js","./winning-phrases.js":"/Users/REDLIST/Sites/fed-bingo/app/scripts/utils/winning-phrases.js","./wordlist.js":"/Users/REDLIST/Sites/fed-bingo/app/scripts/utils/wordlist.js","jquery":"/Users/REDLIST/Sites/fed-bingo/node_modules/jquery/dist/jquery.js"}],"/Users/REDLIST/Sites/fed-bingo/app/scripts/utils/paul-phrases.js":[function(require,module,exports){
'use strict';

module.exports = ['Does socket.IO come with deoderant?', 'Thanks Obama!', 'Wait, what?', 'git push origin master --force ... oops, sorry, wrong window.', 'Dude... wait, I forgot what I was going to say.', 'Maris just told me I ran out of sick days.', 'I can\'t find my long-johns.', 'Fuck, I have pink eye again.'];

},{}],"/Users/REDLIST/Sites/fed-bingo/app/scripts/utils/winning-combos.js":[function(require,module,exports){
"use strict";

module.exports = [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]];

},{}],"/Users/REDLIST/Sites/fed-bingo/app/scripts/utils/winning-images.js":[function(require,module,exports){
'use strict';

module.exports = ['/images/winners/cook.jpg', '/images/winners/frost.jpg', '/images/winners/irish.jpg', '/images/winners/roberts.jpg', '/images/winners/stalin.jpg', '/images/winners/steamroller.jpg'];

},{}],"/Users/REDLIST/Sites/fed-bingo/app/scripts/utils/winning-phrases.js":[function(require,module,exports){
'use strict';

module.exports = ['Wow! What a thought leader!', 'Steamrolled!', 'Go home to your cats!', 'Have you thought of a responsive image solution?', 'I chatted with Norman, I think we should do a front-end bingo workshop.', 'I read a blog post article about how you suck.', 'I\'ll be re-writing this app so maybe you can win next time.', 'On Akamai, you always win.'];

},{}],"/Users/REDLIST/Sites/fed-bingo/app/scripts/utils/wordlist.js":[function(require,module,exports){
'use strict';

module.exports = ['apple', 'atom', 'brad frost', 'cats', 'cutting edge', 'component', 'convention', 'device', 'harry roberts', 'itcss', 'javascript', 'layout', 'load time', 'molecule', 'optimization', 'organism', 'paradigm', 'paul irish', 'pages', 'pieces', 'process', 'retina', 'sass', 'screen-size', 'user'];

},{}],"/Users/REDLIST/Sites/fed-bingo/node_modules/jquery/dist/jquery.js":[function(require,module,exports){
/*!
 * jQuery JavaScript Library v2.1.4
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2015-04-28T16:01Z
 */

(function( global, factory ) {

	if ( typeof module === "object" && typeof module.exports === "object" ) {
		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Support: Firefox 18+
// Can't be in strict mode, several libs including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
//

var arr = [];

var slice = arr.slice;

var concat = arr.concat;

var push = arr.push;

var indexOf = arr.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var support = {};



var
	// Use the correct document accordingly with window argument (sandbox)
	document = window.document,

	version = "2.1.4",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	},

	// Support: Android<4.1
	// Make sure we trim BOM and NBSP
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

jQuery.fn = jQuery.prototype = {
	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// Start with an empty selector
	selector: "",

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num != null ?

			// Return just the one element from the set
			( num < 0 ? this[ num + this.length ] : this[ num ] ) :

			// Return all the elements in a clean array
			slice.call( this );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;
		ret.context = this.context;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: arr.sort,
	splice: arr.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// Skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// Extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	isArray: Array.isArray,

	isWindow: function( obj ) {
		return obj != null && obj === obj.window;
	},

	isNumeric: function( obj ) {
		// parseFloat NaNs numeric-cast false positives (null|true|false|"")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		// adding 1 corrects loss of precision from parseFloat (#15100)
		return !jQuery.isArray( obj ) && (obj - parseFloat( obj ) + 1) >= 0;
	},

	isPlainObject: function( obj ) {
		// Not plain objects:
		// - Any object or value whose internal [[Class]] property is not "[object Object]"
		// - DOM nodes
		// - window
		if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		if ( obj.constructor &&
				!hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
			return false;
		}

		// If the function hasn't returned already, we're confident that
		// |obj| is a plain object, created by {} or constructed with new Object
		return true;
	},

	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	type: function( obj ) {
		if ( obj == null ) {
			return obj + "";
		}
		// Support: Android<4.0, iOS<6 (functionish RegExp)
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ toString.call(obj) ] || "object" :
			typeof obj;
	},

	// Evaluates a script in a global context
	globalEval: function( code ) {
		var script,
			indirect = eval;

		code = jQuery.trim( code );

		if ( code ) {
			// If the code includes a valid, prologue position
			// strict mode pragma, execute code by injecting a
			// script tag into the document.
			if ( code.indexOf("use strict") === 1 ) {
				script = document.createElement("script");
				script.text = code;
				document.head.appendChild( script ).parentNode.removeChild( script );
			} else {
			// Otherwise, avoid the DOM node creation, insertion
			// and removal by using an indirect global eval
				indirect( code );
			}
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Support: IE9-11+
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	// args is for internal usage only
	each: function( obj, callback, args ) {
		var value,
			i = 0,
			length = obj.length,
			isArray = isArraylike( obj );

		if ( args ) {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			}
		}

		return obj;
	},

	// Support: Android<4.1
	trim: function( text ) {
		return text == null ?
			"" :
			( text + "" ).replace( rtrim, "" );
	},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		return arr == null ? -1 : indexOf.call( arr, elem, i );
	},

	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		for ( ; j < len; j++ ) {
			first[ i++ ] = second[ j ];
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var value,
			i = 0,
			length = elems.length,
			isArray = isArraylike( elems ),
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var tmp, args, proxy;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	now: Date.now,

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
});

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function isArraylike( obj ) {

	// Support: iOS 8.2 (not reproducible in simulator)
	// `in` check used to prevent JIT error (gh-2145)
	// hasOwn isn't used here due to false negatives
	// regarding Nodelist length in IE
	var length = "length" in obj && obj.length,
		type = jQuery.type( obj );

	if ( type === "function" || jQuery.isWindow( obj ) ) {
		return false;
	}

	if ( obj.nodeType === 1 && length ) {
		return true;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v2.2.0-pre
 * http://sizzlejs.com/
 *
 * Copyright 2008, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-12-16
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// General-purpose constants
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// http://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + characterEncoding + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,
	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];
	nodeType = context.nodeType;

	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	if ( !seed && documentIsHTML ) {

		// Try to shortcut find operations when possible (e.g., not under DocumentFragment)
		if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document (jQuery #6963)
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			nid = old = expando;
			newContext = context;
			newSelector = nodeType !== 1 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && testContext( context.parentNode ) || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, parent,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;
	parent = doc.defaultView;

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	if ( parent && parent !== parent.top ) {
		// IE11 does not have attachEvent, so all must suffer
		if ( parent.addEventListener ) {
			parent.addEventListener( "unload", unloadHandler, false );
		} else if ( parent.attachEvent ) {
			parent.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Support tests
	---------------------------------------------------------------------- */
	documentIsHTML = !isXML( doc );

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( div ) {
		div.className = "i";
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( doc.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [ m ] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			docElem.appendChild( div ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\f]' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( div.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.2+, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.7+
			if ( !div.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibing-combinator selector` fails
			if ( !div.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( div ) {
			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = doc.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( div.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return doc;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (oldCache = outerCache[ dir ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							outerCache[ dir ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context !== document && context;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is no seed and only one group
	if ( match.length === 1 ) {

		// Take a shortcut and set the context if the root selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				support.getById && context.nodeType === 9 && documentIsHTML &&
				Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;



var rneedsContext = jQuery.expr.match.needsContext;

var rsingleTag = (/^<(\w+)\s*\/?>(?:<\/\1>|)$/);



var risSimple = /^.[^:#\[\.,]*$/;

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			/* jshint -W018 */
			return !!qualifier.call( elem, i, elem ) !== not;
		});

	}

	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		});

	}

	if ( typeof qualifier === "string" ) {
		if ( risSimple.test( qualifier ) ) {
			return jQuery.filter( qualifier, elements, not );
		}

		qualifier = jQuery.filter( qualifier, elements );
	}

	return jQuery.grep( elements, function( elem ) {
		return ( indexOf.call( qualifier, elem ) >= 0 ) !== not;
	});
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	return elems.length === 1 && elem.nodeType === 1 ?
		jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
		jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
			return elem.nodeType === 1;
		}));
};

jQuery.fn.extend({
	find: function( selector ) {
		var i,
			len = this.length,
			ret = [],
			self = this;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter(function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			}) );
		}

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
		ret.selector = this.selector ? this.selector + " " + selector : selector;
		return ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow(this, selector || [], false) );
	},
	not: function( selector ) {
		return this.pushStack( winnow(this, selector || [], true) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
});


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

	init = jQuery.fn.init = function( selector, context ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector[0] === "<" && selector[ selector.length - 1 ] === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof jQuery ? context[0] : context;

					// Option to run scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[1],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {
							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[2] );

					// Support: Blackberry 4.6
					// gEBID returns nodes no longer in the document (#6963)
					if ( elem && elem.parentNode ) {
						// Inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return typeof rootjQuery.ready !== "undefined" ?
				rootjQuery.ready( selector ) :
				// Execute immediately if ready is not present
				selector( jQuery );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,
	// Methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.extend({
	dir: function( elem, dir, until ) {
		var matched = [],
			truncate = until !== undefined;

		while ( (elem = elem[ dir ]) && elem.nodeType !== 9 ) {
			if ( elem.nodeType === 1 ) {
				if ( truncate && jQuery( elem ).is( until ) ) {
					break;
				}
				matched.push( elem );
			}
		}
		return matched;
	},

	sibling: function( n, elem ) {
		var matched = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				matched.push( n );
			}
		}

		return matched;
	}
});

jQuery.fn.extend({
	has: function( target ) {
		var targets = jQuery( target, this ),
			l = targets.length;

		return this.filter(function() {
			var i = 0;
			for ( ; i < l; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( ; i < l; i++ ) {
			for ( cur = this[i]; cur && cur !== context; cur = cur.parentNode ) {
				// Always skip document fragments
				if ( cur.nodeType < 11 && (pos ?
					pos.index(cur) > -1 :

					// Don't pass non-elements to Sizzle
					cur.nodeType === 1 &&
						jQuery.find.matchesSelector(cur, selectors)) ) {

					matched.push( cur );
					break;
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.unique( matched ) : matched );
	},

	// Determine the position of an element within the set
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// Index in selector
		if ( typeof elem === "string" ) {
			return indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
		return indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.unique(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

function sibling( cur, dir ) {
	while ( (cur = cur[dir]) && cur.nodeType !== 1 ) {}
	return cur;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return elem.contentDocument || jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var matched = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			matched = jQuery.filter( selector, matched );
		}

		if ( this.length > 1 ) {
			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				jQuery.unique( matched );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				matched.reverse();
			}
		}

		return this.pushStack( matched );
	};
});
var rnotwhite = (/\S+/g);



// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
	var object = optionsCache[ options ] = {};
	jQuery.each( options.match( rnotwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	});
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list was already fired
		fired,
		// Flag to know if list is currently firing
		firing,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = !options.once && [],
		// Fire callbacks
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
			},
			// Remove all callbacks from the list
			empty: function() {
				list = [];
				firingLength = 0;
				return this;
			},
			// Have the list do nothing anymore
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( list && ( !fired || stack ) ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


jQuery.extend({

	Deferred: function( func ) {
		var tuples = [
				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[1] ](function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.done( newDefer.resolve )
										.fail( newDefer.reject )
										.progress( newDefer.notify );
								} else {
									newDefer[ tuple[ 0 ] + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
								}
							});
						});
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			// promise[ done | fail | progress ] = list.add
			promise[ tuple[1] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ]
			deferred[ tuple[0] ] = function() {
				deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( values === progressValues ) {
						deferred.notifyWith( contexts, values );
					} else if ( !( --remaining ) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// Add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject )
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}

		// If we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});


// The deferred used on DOM ready
var readyList;

jQuery.fn.ready = function( fn ) {
	// Add the callback
	jQuery.ready.promise().done( fn );

	return this;
};

jQuery.extend({
	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		if ( jQuery.fn.triggerHandler ) {
			jQuery( document ).triggerHandler( "ready" );
			jQuery( document ).off( "ready" );
		}
	}
});

/**
 * The ready event handler and self cleanup method
 */
function completed() {
	document.removeEventListener( "DOMContentLoaded", completed, false );
	window.removeEventListener( "load", completed, false );
	jQuery.ready();
}

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// We once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout( jQuery.ready );

		} else {

			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", completed, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", completed, false );
		}
	}
	return readyList.promise( obj );
};

// Kick off the DOM ready check even if the user does not
jQuery.ready.promise();




// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = jQuery.access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		len = elems.length,
		bulk = key == null;

	// Sets many values
	if ( jQuery.type( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !jQuery.isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {
			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < len; i++ ) {
				fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
			}
		}
	}

	return chainable ?
		elems :

		// Gets
		bulk ?
			fn.call( elems ) :
			len ? fn( elems[0], key ) : emptyGet;
};


/**
 * Determines whether an object can have data
 */
jQuery.acceptData = function( owner ) {
	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
	/* jshint -W018 */
	return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};


function Data() {
	// Support: Android<4,
	// Old WebKit does not have Object.preventExtensions/freeze method,
	// return new empty object instead with no [[set]] accessor
	Object.defineProperty( this.cache = {}, 0, {
		get: function() {
			return {};
		}
	});

	this.expando = jQuery.expando + Data.uid++;
}

Data.uid = 1;
Data.accepts = jQuery.acceptData;

Data.prototype = {
	key: function( owner ) {
		// We can accept data for non-element nodes in modern browsers,
		// but we should not, see #8335.
		// Always return the key for a frozen object.
		if ( !Data.accepts( owner ) ) {
			return 0;
		}

		var descriptor = {},
			// Check if the owner object already has a cache key
			unlock = owner[ this.expando ];

		// If not, create one
		if ( !unlock ) {
			unlock = Data.uid++;

			// Secure it in a non-enumerable, non-writable property
			try {
				descriptor[ this.expando ] = { value: unlock };
				Object.defineProperties( owner, descriptor );

			// Support: Android<4
			// Fallback to a less secure definition
			} catch ( e ) {
				descriptor[ this.expando ] = unlock;
				jQuery.extend( owner, descriptor );
			}
		}

		// Ensure the cache object
		if ( !this.cache[ unlock ] ) {
			this.cache[ unlock ] = {};
		}

		return unlock;
	},
	set: function( owner, data, value ) {
		var prop,
			// There may be an unlock assigned to this node,
			// if there is no entry for this "owner", create one inline
			// and set the unlock as though an owner entry had always existed
			unlock = this.key( owner ),
			cache = this.cache[ unlock ];

		// Handle: [ owner, key, value ] args
		if ( typeof data === "string" ) {
			cache[ data ] = value;

		// Handle: [ owner, { properties } ] args
		} else {
			// Fresh assignments by object are shallow copied
			if ( jQuery.isEmptyObject( cache ) ) {
				jQuery.extend( this.cache[ unlock ], data );
			// Otherwise, copy the properties one-by-one to the cache object
			} else {
				for ( prop in data ) {
					cache[ prop ] = data[ prop ];
				}
			}
		}
		return cache;
	},
	get: function( owner, key ) {
		// Either a valid cache is found, or will be created.
		// New caches will be created and the unlock returned,
		// allowing direct access to the newly created
		// empty data object. A valid owner object must be provided.
		var cache = this.cache[ this.key( owner ) ];

		return key === undefined ?
			cache : cache[ key ];
	},
	access: function( owner, key, value ) {
		var stored;
		// In cases where either:
		//
		//   1. No key was specified
		//   2. A string key was specified, but no value provided
		//
		// Take the "read" path and allow the get method to determine
		// which value to return, respectively either:
		//
		//   1. The entire cache object
		//   2. The data stored at the key
		//
		if ( key === undefined ||
				((key && typeof key === "string") && value === undefined) ) {

			stored = this.get( owner, key );

			return stored !== undefined ?
				stored : this.get( owner, jQuery.camelCase(key) );
		}

		// [*]When the key is not a string, or both a key and value
		// are specified, set or extend (existing objects) with either:
		//
		//   1. An object of properties
		//   2. A key and value
		//
		this.set( owner, key, value );

		// Since the "set" path can have two possible entry points
		// return the expected data based on which path was taken[*]
		return value !== undefined ? value : key;
	},
	remove: function( owner, key ) {
		var i, name, camel,
			unlock = this.key( owner ),
			cache = this.cache[ unlock ];

		if ( key === undefined ) {
			this.cache[ unlock ] = {};

		} else {
			// Support array or space separated string of keys
			if ( jQuery.isArray( key ) ) {
				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				name = key.concat( key.map( jQuery.camelCase ) );
			} else {
				camel = jQuery.camelCase( key );
				// Try the string as a key before any manipulation
				if ( key in cache ) {
					name = [ key, camel ];
				} else {
					// If a key with the spaces exists, use it.
					// Otherwise, create an array by matching non-whitespace
					name = camel;
					name = name in cache ?
						[ name ] : ( name.match( rnotwhite ) || [] );
				}
			}

			i = name.length;
			while ( i-- ) {
				delete cache[ name[ i ] ];
			}
		}
	},
	hasData: function( owner ) {
		return !jQuery.isEmptyObject(
			this.cache[ owner[ this.expando ] ] || {}
		);
	},
	discard: function( owner ) {
		if ( owner[ this.expando ] ) {
			delete this.cache[ owner[ this.expando ] ];
		}
	}
};
var data_priv = new Data();

var data_user = new Data();



//	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /([A-Z])/g;

function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {
		name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();
		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
					+data + "" === data ? +data :
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
					data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			data_user.set( elem, key, data );
		} else {
			data = undefined;
		}
	}
	return data;
}

jQuery.extend({
	hasData: function( elem ) {
		return data_user.hasData( elem ) || data_priv.hasData( elem );
	},

	data: function( elem, name, data ) {
		return data_user.access( elem, name, data );
	},

	removeData: function( elem, name ) {
		data_user.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to data_priv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return data_priv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		data_priv.remove( elem, name );
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var i, name, data,
			elem = this[ 0 ],
			attrs = elem && elem.attributes;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = data_user.get( elem );

				if ( elem.nodeType === 1 && !data_priv.get( elem, "hasDataAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {

						// Support: IE11+
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {
								name = jQuery.camelCase( name.slice(5) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					data_priv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each(function() {
				data_user.set( this, key );
			});
		}

		return access( this, function( value ) {
			var data,
				camelKey = jQuery.camelCase( key );

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			if ( elem && value === undefined ) {
				// Attempt to get data from the cache
				// with the key as-is
				data = data_user.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to get data from the cache
				// with the key camelized
				data = data_user.get( elem, camelKey );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				data = dataAttr( elem, camelKey, undefined );
				if ( data !== undefined ) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each(function() {
				// First, attempt to store a copy or reference of any
				// data that might've been store with a camelCased key.
				var data = data_user.get( this, camelKey );

				// For HTML5 data-* attribute interop, we have to
				// store property names with dashes in a camelCase form.
				// This might not apply to all properties...*
				data_user.set( this, camelKey, value );

				// *... In the case of properties that might _actually_
				// have dashes, we need to also store a copy of that
				// unchanged property.
				if ( key.indexOf("-") !== -1 && data !== undefined ) {
					data_user.set( this, key, value );
				}
			});
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each(function() {
			data_user.remove( this, key );
		});
	}
});


jQuery.extend({
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = data_priv.get( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray( data ) ) {
					queue = data_priv.access( elem, type, jQuery.makeArray(data) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// Clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// Not public - generate a queueHooks object, or return the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return data_priv.get( elem, key ) || data_priv.access( elem, key, {
			empty: jQuery.Callbacks("once memory").add(function() {
				data_priv.remove( elem, [ type + "queue", key ] );
			})
		});
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[0], type );
		}

		return data === undefined ?
			this :
			this.each(function() {
				var queue = jQuery.queue( this, type, data );

				// Ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[0] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},
	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = data_priv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
});
var pnum = (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source;

var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var isHidden = function( elem, el ) {
		// isHidden might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;
		return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
	};

var rcheckableType = (/^(?:checkbox|radio)$/i);



(function() {
	var fragment = document.createDocumentFragment(),
		div = fragment.appendChild( document.createElement( "div" ) ),
		input = document.createElement( "input" );

	// Support: Safari<=5.1
	// Check state lost if the name is set (#11217)
	// Support: Windows Web Apps (WWA)
	// `name` and `type` must use .setAttribute for WWA (#14901)
	input.setAttribute( "type", "radio" );
	input.setAttribute( "checked", "checked" );
	input.setAttribute( "name", "t" );

	div.appendChild( input );

	// Support: Safari<=5.1, Android<4.2
	// Older WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE<=11+
	// Make sure textarea (and checkbox) defaultValue is properly cloned
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;
})();
var strundefined = typeof undefined;



support.focusinBubbles = "onfocusin" in window;


var
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|pointer|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.get( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !(events = elemData.events) ) {
			events = elemData.events = {};
		}
		if ( !(eventHandle = elemData.handle) ) {
			eventHandle = elemData.handle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== strundefined && jQuery.event.triggered !== e.type ?
					jQuery.event.dispatch.apply( elem, arguments ) : undefined;
			};
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !(handlers = events[ type ]) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.hasData( elem ) && data_priv.get( elem );

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;
			data_priv.remove( elem, "events" );
		}
	},

	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === (elem.ownerDocument || document) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( data_priv.get( cur, "events" ) || {} )[ event.type ] && data_priv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && jQuery.acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
				jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					elem[ type ]();
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event );

		var i, j, ret, matched, handleObj,
			handlerQueue = [],
			args = slice.call( arguments ),
			handlers = ( data_priv.get( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or 2) have namespace(s)
				// a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( (event.result = ret) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var i, matches, sel, handleObj,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.disabled !== true || event.type !== "click" ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}

		return handlerQueue;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var eventDoc, doc, body,
				button = original.button;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,
			originalEvent = event,
			fixHook = this.fixHooks[ type ];

		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
				rmouseEvent.test( type ) ? this.mouseHooks :
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = new jQuery.Event( originalEvent );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: Cordova 2.5 (WebKit) (#13255)
		// All events should have a target; Cordova deviceready doesn't
		if ( !event.target ) {
			event.target = document;
		}

		// Support: Safari 6.0+, Chrome<28
		// Target should not be a text node (#504, #13143)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
	},

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {
			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					this.focus();
					return false;
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return jQuery.nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined && event.originalEvent ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = function( elem, type, handle ) {
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle, false );
	}
};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined &&
				// Support: Android<4.0
				src.returnValue === false ?
			returnTrue :
			returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && e.preventDefault ) {
			e.preventDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && e.stopPropagation ) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function() {
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if ( e && e.stopImmediatePropagation ) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
// Support: Chrome 15+
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// Support: Firefox, Chrome, Safari
// Create "bubbling" focus and blur events
if ( !support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = data_priv.access( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				data_priv.access( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = data_priv.access( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					data_priv.remove( doc, fix );

				} else {
					data_priv.access( doc, fix, attaches );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var origFn, type;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		var elem = this[0];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
});


var
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	rtagName = /<([\w:]+)/,
	rhtml = /<|&#?\w+;/,
	rnoInnerhtml = /<(?:script|style|link)/i,
	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptType = /^$|\/(?:java|ecma)script/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,

	// We have to close these tags to support XHTML (#13200)
	wrapMap = {

		// Support: IE9
		option: [ 1, "<select multiple='multiple'>", "</select>" ],

		thead: [ 1, "<table>", "</table>" ],
		col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		_default: [ 0, "", "" ]
	};

// Support: IE9
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

// Support: 1.x compatibility
// Manipulating tables requires a tbody
function manipulationTarget( elem, content ) {
	return jQuery.nodeName( elem, "table" ) &&
		jQuery.nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ?

		elem.getElementsByTagName("tbody")[0] ||
			elem.appendChild( elem.ownerDocument.createElement("tbody") ) :
		elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );

	if ( match ) {
		elem.type = match[ 1 ];
	} else {
		elem.removeAttribute("type");
	}

	return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		data_priv.set(
			elems[ i ], "globalEval", !refElements || data_priv.get( refElements[ i ], "globalEval" )
		);
	}
}

function cloneCopyEvent( src, dest ) {
	var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

	if ( dest.nodeType !== 1 ) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	if ( data_priv.hasData( src ) ) {
		pdataOld = data_priv.access( src );
		pdataCur = data_priv.set( dest, pdataOld );
		events = pdataOld.events;

		if ( events ) {
			delete pdataCur.handle;
			pdataCur.events = {};

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	if ( data_user.hasData( src ) ) {
		udataOld = data_user.access( src );
		udataCur = jQuery.extend( {}, udataOld );

		data_user.set( dest, udataCur );
	}
}

function getAll( context, tag ) {
	var ret = context.getElementsByTagName ? context.getElementsByTagName( tag || "*" ) :
			context.querySelectorAll ? context.querySelectorAll( tag || "*" ) :
			[];

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], ret ) :
		ret;
}

// Fix IE bugs, see support tests
function fixInput( src, dest ) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

jQuery.extend({
	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var i, l, srcElements, destElements,
			clone = elem.cloneNode( true ),
			inPage = jQuery.contains( elem.ownerDocument, elem );

		// Fix IE cloning issues
		if ( !support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) &&
				!jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	buildFragment: function( elems, context, scripts, selection ) {
		var elem, tmp, tag, wrap, contains, j,
			fragment = context.createDocumentFragment(),
			nodes = [],
			i = 0,
			l = elems.length;

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {
					// Support: QtWebKit, PhantomJS
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || fragment.appendChild( context.createElement("div") );

					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;
					tmp.innerHTML = wrap[ 1 ] + elem.replace( rxhtmlTag, "<$1></$2>" ) + wrap[ 2 ];

					// Descend through wrappers to the right content
					j = wrap[ 0 ];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Support: QtWebKit, PhantomJS
					// push.apply(_, arraylike) throws on ancient WebKit
					jQuery.merge( nodes, tmp.childNodes );

					// Remember the top-level container
					tmp = fragment.firstChild;

					// Ensure the created nodes are orphaned (#12392)
					tmp.textContent = "";
				}
			}
		}

		// Remove wrapper from fragment
		fragment.textContent = "";

		i = 0;
		while ( (elem = nodes[ i++ ]) ) {

			// #4087 - If origin and destination elements are the same, and this is
			// that element, do not do anything
			if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
				continue;
			}

			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			tmp = getAll( fragment.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( (elem = tmp[ j++ ]) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		return fragment;
	},

	cleanData: function( elems ) {
		var data, elem, type, key,
			special = jQuery.event.special,
			i = 0;

		for ( ; (elem = elems[ i ]) !== undefined; i++ ) {
			if ( jQuery.acceptData( elem ) ) {
				key = elem[ data_priv.expando ];

				if ( key && (data = data_priv.cache[ key ]) ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}
					if ( data_priv.cache[ key ] ) {
						// Discard any remaining `private` data
						delete data_priv.cache[ key ];
					}
				}
			}
			// Discard any remaining `user` data
			delete data_user.cache[ elem[ data_user.expando ] ];
		}
	}
});

jQuery.fn.extend({
	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().each(function() {
					if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
						this.textContent = value;
					}
				});
		}, null, value, arguments.length );
	},

	append: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		});
	},

	before: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		});
	},

	after: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		});
	},

	remove: function( selector, keepData /* Internal Use Only */ ) {
		var elem,
			elems = selector ? jQuery.filter( selector, this ) : this,
			i = 0;

		for ( ; (elem = elems[i]) != null; i++ ) {
			if ( !keepData && elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem ) );
			}

			if ( elem.parentNode ) {
				if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
					setGlobalEval( getAll( elem, "script" ) );
				}
				elem.parentNode.removeChild( elem );
			}
		}

		return this;
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			if ( elem.nodeType === 1 ) {

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map(function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = value.replace( rxhtmlTag, "<$1></$2>" );

				try {
					for ( ; i < l; i++ ) {
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var arg = arguments[ 0 ];

		// Make the changes, replacing each context element with the new content
		this.domManip( arguments, function( elem ) {
			arg = this.parentNode;

			jQuery.cleanData( getAll( this ) );

			if ( arg ) {
				arg.replaceChild( elem, this );
			}
		});

		// Force removal if there was no new content (e.g., from empty arguments)
		return arg && (arg.length || arg.nodeType) ? this : this.remove();
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, callback ) {

		// Flatten any nested arrays
		args = concat.apply( [], args );

		var fragment, first, scripts, hasScripts, node, doc,
			i = 0,
			l = this.length,
			set = this,
			iNoClone = l - 1,
			value = args[ 0 ],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction ||
				( l > 1 && typeof value === "string" &&
					!support.checkClone && rchecked.test( value ) ) ) {
			return this.each(function( index ) {
				var self = set.eq( index );
				if ( isFunction ) {
					args[ 0 ] = value.call( this, index, self.html() );
				}
				self.domManip( args, callback );
			});
		}

		if ( l ) {
			fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, this );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			if ( first ) {
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {
							// Support: QtWebKit
							// jQuery.merge because push.apply(_, arraylike) throws
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call( this[ i ], node, i );
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!data_priv.access( node, "globalEval" ) && jQuery.contains( doc, node ) ) {

							if ( node.src ) {
								// Optional AJAX dependency, but won't run scripts if not present
								if ( jQuery._evalUrl ) {
									jQuery._evalUrl( node.src );
								}
							} else {
								jQuery.globalEval( node.textContent.replace( rcleanScript, "" ) );
							}
						}
					}
				}
			}
		}

		return this;
	}
});

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1,
			i = 0;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone( true );
			jQuery( insert[ i ] )[ original ]( elems );

			// Support: QtWebKit
			// .get() because push.apply(_, arraylike) throws
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
});


var iframe,
	elemdisplay = {};

/**
 * Retrieve the actual display of a element
 * @param {String} name nodeName of the element
 * @param {Object} doc Document object
 */
// Called only from within defaultDisplay
function actualDisplay( name, doc ) {
	var style,
		elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),

		// getDefaultComputedStyle might be reliably used only on attached element
		display = window.getDefaultComputedStyle && ( style = window.getDefaultComputedStyle( elem[ 0 ] ) ) ?

			// Use of this method is a temporary fix (more like optimization) until something better comes along,
			// since it was removed from specification and supported only in FF
			style.display : jQuery.css( elem[ 0 ], "display" );

	// We don't have any data stored on the element,
	// so use "detach" method as fast way to get rid of the element
	elem.detach();

	return display;
}

/**
 * Try to determine the default display value of an element
 * @param {String} nodeName
 */
function defaultDisplay( nodeName ) {
	var doc = document,
		display = elemdisplay[ nodeName ];

	if ( !display ) {
		display = actualDisplay( nodeName, doc );

		// If the simple way fails, read from inside an iframe
		if ( display === "none" || !display ) {

			// Use the already-created iframe if possible
			iframe = (iframe || jQuery( "<iframe frameborder='0' width='0' height='0'/>" )).appendTo( doc.documentElement );

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = iframe[ 0 ].contentDocument;

			// Support: IE
			doc.write();
			doc.close();

			display = actualDisplay( nodeName, doc );
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return display;
}
var rmargin = (/^margin/);

var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );

var getStyles = function( elem ) {
		// Support: IE<=11+, Firefox<=30+ (#15098, #14150)
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		if ( elem.ownerDocument.defaultView.opener ) {
			return elem.ownerDocument.defaultView.getComputedStyle( elem, null );
		}

		return window.getComputedStyle( elem, null );
	};



function curCSS( elem, name, computed ) {
	var width, minWidth, maxWidth, ret,
		style = elem.style;

	computed = computed || getStyles( elem );

	// Support: IE9
	// getPropertyValue is only needed for .css('filter') (#12537)
	if ( computed ) {
		ret = computed.getPropertyValue( name ) || computed[ name ];
	}

	if ( computed ) {

		if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// Support: iOS < 6
		// A tribute to the "awesome hack by Dean Edwards"
		// iOS < 6 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
		// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
		if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret !== undefined ?
		// Support: IE
		// IE returns zIndex value as an integer.
		ret + "" :
		ret;
}


function addGetHookIf( conditionFn, hookFn ) {
	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			if ( conditionFn() ) {
				// Hook not needed (or it's not possible to use it due
				// to missing dependency), remove it.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.
			return (this.get = hookFn).apply( this, arguments );
		}
	};
}


(function() {
	var pixelPositionVal, boxSizingReliableVal,
		docElem = document.documentElement,
		container = document.createElement( "div" ),
		div = document.createElement( "div" );

	if ( !div.style ) {
		return;
	}

	// Support: IE9-11+
	// Style of cloned element affects source element cloned (#8908)
	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	container.style.cssText = "border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;" +
		"position:absolute";
	container.appendChild( div );

	// Executing both pixelPosition & boxSizingReliable tests require only one layout
	// so they're executed at the same time to save the second computation.
	function computePixelPositionAndBoxSizingReliable() {
		div.style.cssText =
			// Support: Firefox<29, Android 2.3
			// Vendor-prefix box-sizing
			"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;" +
			"box-sizing:border-box;display:block;margin-top:1%;top:1%;" +
			"border:1px;padding:1px;width:4px;position:absolute";
		div.innerHTML = "";
		docElem.appendChild( container );

		var divStyle = window.getComputedStyle( div, null );
		pixelPositionVal = divStyle.top !== "1%";
		boxSizingReliableVal = divStyle.width === "4px";

		docElem.removeChild( container );
	}

	// Support: node.js jsdom
	// Don't assume that getComputedStyle is a property of the global object
	if ( window.getComputedStyle ) {
		jQuery.extend( support, {
			pixelPosition: function() {

				// This test is executed only once but we still do memoizing
				// since we can use the boxSizingReliable pre-computing.
				// No need to check if the test was already performed, though.
				computePixelPositionAndBoxSizingReliable();
				return pixelPositionVal;
			},
			boxSizingReliable: function() {
				if ( boxSizingReliableVal == null ) {
					computePixelPositionAndBoxSizingReliable();
				}
				return boxSizingReliableVal;
			},
			reliableMarginRight: function() {

				// Support: Android 2.3
				// Check if div with explicit width and no margin-right incorrectly
				// gets computed margin-right based on width of container. (#3333)
				// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
				// This support function is only executed once so no memoizing is needed.
				var ret,
					marginDiv = div.appendChild( document.createElement( "div" ) );

				// Reset CSS: box-sizing; display; margin; border; padding
				marginDiv.style.cssText = div.style.cssText =
					// Support: Firefox<29, Android 2.3
					// Vendor-prefix box-sizing
					"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;" +
					"box-sizing:content-box;display:block;margin:0;border:0;padding:0";
				marginDiv.style.marginRight = marginDiv.style.width = "0";
				div.style.width = "1px";
				docElem.appendChild( container );

				ret = !parseFloat( window.getComputedStyle( marginDiv, null ).marginRight );

				docElem.removeChild( container );
				div.removeChild( marginDiv );

				return ret;
			}
		});
	}
})();


// A method for quickly swapping in/out CSS properties to get correct calculations.
jQuery.swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};


var
	// Swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rnumsplit = new RegExp( "^(" + pnum + ")(.*)$", "i" ),
	rrelNum = new RegExp( "^([+-])=(" + pnum + ")", "i" ),

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	},

	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];

// Return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

	// Shortcut for names that are not vendor prefixed
	if ( name in style ) {
		return name;
	}

	// Check for vendor prefixed names
	var capName = name[0].toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in style ) {
			return name;
		}
	}

	return origName;
}

function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?
		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {
		// Both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {
			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// At this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {
			// At this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// At this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles( elem ),
		isBorderBox = jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// Some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {
		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name, styles );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test(val) ) {
			return val;
		}

		// Check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox &&
			( support.boxSizingReliable() || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// Use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

function showHide( elements, show ) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		values[ index ] = data_priv.get( elem, "olddisplay" );
		display = elem.style.display;
		if ( show ) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] = data_priv.access( elem, "olddisplay", defaultDisplay(elem.nodeName) );
			}
		} else {
			hidden = isHidden( elem );

			if ( display !== "none" || !hidden ) {
				data_priv.set( elem, "olddisplay", hidden ? display : jQuery.css( elem, "display" ) );
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

jQuery.extend({

	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {

					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"columnCount": true,
		"fillOpacity": true,
		"flexGrow": true,
		"flexShrink": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		"float": "cssFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {

		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

		// Gets hook for the prefixed version, then unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// Convert "+=" or "-=" to relative numbers (#7345)
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set (#7116)
			if ( value == null || value !== value ) {
				return;
			}

			// If a number, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// Support: IE9-11+
			// background-* props affect original clone's values
			if ( !support.clearCloneStyle && value === "" && name.indexOf( "background" ) === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {
				style[ name ] = value;
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var val, num, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

		// Try prefixed name followed by the unprefixed name
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		// Convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Make numeric if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || jQuery.isNumeric( num ) ? num || 0 : val;
		}
		return val;
	}
});

jQuery.each([ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {

				// Certain elements can have dimension info if we invisibly show them
				// but it must have a current display style that would benefit
				return rdisplayswap.test( jQuery.css( elem, "display" ) ) && elem.offsetWidth === 0 ?
					jQuery.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					}) :
					getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var styles = extra && getStyles( elem );
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				) : 0
			);
		}
	};
});

// Support: Android 2.3
jQuery.cssHooks.marginRight = addGetHookIf( support.reliableMarginRight,
	function( elem, computed ) {
		if ( computed ) {
			return jQuery.swap( elem, { "display": "inline-block" },
				curCSS, [ elem, "marginRight" ] );
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// Assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
});

jQuery.fn.extend({
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each(function() {
			if ( isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		});
	}
});


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || "swing";
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			if ( tween.elem[ tween.prop ] != null &&
				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
				return tween.elem[ tween.prop ];
			}

			// Passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails.
			// Simple values such as "10px" are parsed to Float;
			// complex values such as "rotate(1rad)" are returned as-is.
			result = jQuery.css( tween.elem, tween.prop, "" );
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {
			// Use step hook for back compat.
			// Use cssHook if its there.
			// Use .style if available and use plain properties where available.
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE9
// Panic based approach to setting things on disconnected nodes
Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	}
};

jQuery.fx = Tween.prototype.init;

// Back Compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" ),
	rrun = /queueHooks$/,
	animationPrefilters = [ defaultPrefilter ],
	tweeners = {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value ),
				target = tween.cur(),
				parts = rfxnum.exec( value ),
				unit = parts && parts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

				// Starting value computation is required for potential unit mismatches
				start = ( jQuery.cssNumber[ prop ] || unit !== "px" && +target ) &&
					rfxnum.exec( jQuery.css( tween.elem, prop ) ),
				scale = 1,
				maxIterations = 20;

			if ( start && start[ 3 ] !== unit ) {
				// Trust units reported by jQuery.css
				unit = unit || start[ 3 ];

				// Make sure we update the tween properties later on
				parts = parts || [];

				// Iteratively approximate from a nonzero starting point
				start = +target || 1;

				do {
					// If previous iteration zeroed out, double until we get *something*.
					// Use string for doubling so we don't accidentally see scale as unchanged below
					scale = scale || ".5";

					// Adjust and apply
					start = start / scale;
					jQuery.style( tween.elem, prop, start + unit );

				// Update scale, tolerating zero or NaN from tween.cur(),
				// break the loop if scale is unchanged or perfect, or if we've just had enough
				} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
			}

			// Update tween properties
			if ( parts ) {
				start = tween.start = +start || +target || 0;
				tween.unit = unit;
				// If a +=/-= token was provided, we're doing a relative animation
				tween.end = parts[ 1 ] ?
					start + ( parts[ 1 ] + 1 ) * parts[ 2 ] :
					+parts[ 2 ];
			}

			return tween;
		} ]
	};

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout(function() {
		fxNow = undefined;
	});
	return ( fxNow = jQuery.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		i = 0,
		attrs = { height: type };

	// If we include width, step value is 1 to do all cssExpand values,
	// otherwise step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( (tween = collection[ index ].call( animation, prop, value )) ) {

			// We're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	/* jshint validthis: true */
	var prop, value, toggle, tween, hooks, oldfire, display, checkDisplay,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHidden( elem ),
		dataShow = data_priv.get( elem, "fxshow" );

	// Handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function() {
			// Ensure the complete handler is called before this completes
			anim.always(function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			});
		});
	}

	// Height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE9-10 do not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		display = jQuery.css( elem, "display" );

		// Test default display if display is currently "none"
		checkDisplay = display === "none" ?
			data_priv.get( elem, "olddisplay" ) || defaultDisplay( elem.nodeName ) : display;

		if ( checkDisplay === "inline" && jQuery.css( elem, "float" ) === "none" ) {
			style.display = "inline-block";
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		anim.always(function() {
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		});
	}

	// show/hide pass
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );

		// Any non-fx value stops us from restoring the original display value
		} else {
			display = undefined;
		}
	}

	if ( !jQuery.isEmptyObject( orig ) ) {
		if ( dataShow ) {
			if ( "hidden" in dataShow ) {
				hidden = dataShow.hidden;
			}
		} else {
			dataShow = data_priv.access( elem, "fxshow", {} );
		}

		// Store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done(function() {
				jQuery( elem ).hide();
			});
		}
		anim.done(function() {
			var prop;

			data_priv.remove( elem, "fxshow" );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		});
		for ( prop in orig ) {
			tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}

	// If this is a noop like .hide().hide(), restore an overwritten display value
	} else if ( (display === "none" ? defaultDisplay( elem.nodeName ) : display) === "inline" ) {
		style.display = display;
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// Not quite $.extend, this won't overwrite existing keys.
			// Reusing 'index' because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always( function() {
			// Don't match elem in the :animated selector
			delete tick.elem;
		}),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
				// Support: Android 2.3
				// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ]);

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, { specialEasing: {} }, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,
					// If we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// Resolve when we played the last frame; otherwise, reject
				if ( gotoEnd ) {
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

jQuery.Animation = jQuery.extend( Animation, {

	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			tweeners[ prop ] = tweeners[ prop ] || [];
			tweeners[ prop ].unshift( callback );
		}
	},

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			animationPrefilters.unshift( callback );
		} else {
			animationPrefilters.push( callback );
		}
	}
});

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// Normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend({
	fadeTo: function( speed, to, easing, callback ) {

		// Show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// Animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {
				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || data_priv.get( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = data_priv.get( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// Start the next in the queue if the last step wasn't forced.
			// Timers currently will call their complete callbacks, which
			// will dequeue but only if they were gotoEnd.
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each(function() {
			var index,
				data = data_priv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// Enable finishing flag on private data
			data.finish = true;

			// Empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// Look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// Look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// Turn off finishing flag
			delete data.finish;
		});
	}
});

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
});

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		i = 0,
		timers = jQuery.timers;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];
		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	if ( timer() ) {
		jQuery.fx.start();
	} else {
		jQuery.timers.pop();
	}
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = setTimeout( next, time );
		hooks.stop = function() {
			clearTimeout( timeout );
		};
	});
};


(function() {
	var input = document.createElement( "input" ),
		select = document.createElement( "select" ),
		opt = select.appendChild( document.createElement( "option" ) );

	input.type = "checkbox";

	// Support: iOS<=5.1, Android<=4.2+
	// Default value for a checkbox should be "on"
	support.checkOn = input.value !== "";

	// Support: IE<=11+
	// Must access selectedIndex to make default options select
	support.optSelected = opt.selected;

	// Support: Android<=2.3
	// Options inside disabled selects are incorrectly marked as disabled
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Support: IE<=11+
	// An input loses its value after becoming a radio
	input = document.createElement( "input" );
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";
})();


var nodeHook, boolHook,
	attrHandle = jQuery.expr.attrHandle;

jQuery.fn.extend({
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	}
});

jQuery.extend({
	attr: function( elem, name, value ) {
		var hooks, ret,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === strundefined ) {
			return jQuery.prop( elem, name, value );
		}

		// All attributes are lowercase
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : nodeHook );
		}

		if ( value !== undefined ) {

			if ( value === null ) {
				jQuery.removeAttr( elem, name );

			} else if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				elem.setAttribute( name, value + "" );
				return value;
			}

		} else if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
			return ret;

		} else {
			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ?
				undefined :
				ret;
		}
	},

	removeAttr: function( elem, value ) {
		var name, propName,
			i = 0,
			attrNames = value && value.match( rnotwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( (name = attrNames[i++]) ) {
				propName = jQuery.propFix[ name ] || name;

				// Boolean attributes get special treatment (#10870)
				if ( jQuery.expr.match.bool.test( name ) ) {
					// Set corresponding property to false
					elem[ propName ] = false;
				}

				elem.removeAttribute( name );
			}
		}
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" &&
					jQuery.nodeName( elem, "input" ) ) {
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	}
});

// Hooks for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}
		return name;
	}
};
jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = function( elem, name, isXML ) {
		var ret, handle;
		if ( !isXML ) {
			// Avoid an infinite loop by temporarily removing this function from the getter
			handle = attrHandle[ name ];
			attrHandle[ name ] = ret;
			ret = getter( elem, name, isXML ) != null ?
				name.toLowerCase() :
				null;
			attrHandle[ name ] = handle;
		}
		return ret;
	};
});




var rfocusable = /^(?:input|select|textarea|button)$/i;

jQuery.fn.extend({
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		return this.each(function() {
			delete this[ jQuery.propFix[ name ] || name ];
		});
	}
});

jQuery.extend({
	propFix: {
		"for": "htmlFor",
		"class": "className"
	},

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// Don't get/set properties on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			return hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ?
				ret :
				( elem[ name ] = value );

		} else {
			return hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ?
				ret :
				elem[ name ];
		}
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {
				return elem.hasAttribute( "tabindex" ) || rfocusable.test( elem.nodeName ) || elem.href ?
					elem.tabIndex :
					-1;
			}
		}
	}
});

if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {
			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {
				parent.parentNode.selectedIndex;
			}
			return null;
		}
	};
}

jQuery.each([
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
});




var rclass = /[\t\r\n\f]/g;

jQuery.fn.extend({
	addClass: function( value ) {
		var classes, elem, cur, clazz, j, finalValue,
			proceed = typeof value === "string" && value,
			i = 0,
			len = this.length;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call( this, j, this.className ) );
			});
		}

		if ( proceed ) {
			// The disjunction here is for better compressibility (see removeClass)
			classes = ( value || "" ).match( rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					" "
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// only assign if different to avoid unneeded rendering.
					finalValue = jQuery.trim( cur );
					if ( elem.className !== finalValue ) {
						elem.className = finalValue;
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, clazz, j, finalValue,
			proceed = arguments.length === 0 || typeof value === "string" && value,
			i = 0,
			len = this.length;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call( this, j, this.className ) );
			});
		}
		if ( proceed ) {
			classes = ( value || "" ).match( rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					""
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// Only assign if different to avoid unneeded rendering.
					finalValue = value ? jQuery.trim( cur ) : "";
					if ( elem.className !== finalValue ) {
						elem.className = finalValue;
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value;

		if ( typeof stateVal === "boolean" && type === "string" ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// Toggle individual class names
				var className,
					i = 0,
					self = jQuery( this ),
					classNames = value.match( rnotwhite ) || [];

				while ( (className = classNames[ i++ ]) ) {
					// Check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( type === strundefined || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					data_priv.set( this, "__className__", this.className );
				}

				// If the element has a class name or if we're passed `false`,
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				this.className = this.className || value === false ? "" : data_priv.get( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for ( ; i < l; i++ ) {
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
				return true;
			}
		}

		return false;
	}
});




var rreturn = /\r/g;

jQuery.fn.extend({
	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[0];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?
					// Handle most common string cases
					ret.replace(rreturn, "") :
					// Handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each(function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";

			} else if ( typeof val === "number" ) {
				val += "";

			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				});
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	valHooks: {
		option: {
			get: function( elem ) {
				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :
					// Support: IE10-11+
					// option.text throws exceptions (#14686, #14858)
					jQuery.trim( jQuery.text( elem ) );
			}
		},
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one" || index < 0,
					values = one ? null : [],
					max = one ? index + 1 : options.length,
					i = index < 0 ?
						max :
						one ? index : 0;

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// IE6-9 doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&
							// Don't return options that are disabled or in a disabled optgroup
							( support.optDisabled ? !option.disabled : option.getAttribute( "disabled" ) === null ) &&
							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];
					if ( (option.selected = jQuery.inArray( option.value, values ) >= 0) ) {
						optionSet = true;
					}
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	}
});

// Radios and checkboxes getter/setter
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			return elem.getAttribute("value") === null ? "on" : elem.value;
		};
	}
});




// Return jQuery for attributes-only inclusion


jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
});

jQuery.fn.extend({
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	}
});


var nonce = jQuery.now();

var rquery = (/\?/);



// Support: Android 2.3
// Workaround failure to string-cast null input
jQuery.parseJSON = function( data ) {
	return JSON.parse( data + "" );
};


// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml, tmp;
	if ( !data || typeof data !== "string" ) {
		return null;
	}

	// Support: IE9
	try {
		tmp = new DOMParser();
		xml = tmp.parseFromString( data, "text/xml" );
	} catch ( e ) {
		xml = undefined;
	}

	if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rurl = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat( "*" ),

	// Document location
	ajaxLocation = window.location.href,

	// Segment location into parts
	ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {
			// For each dataType in the dataTypeExpression
			while ( (dataType = dataTypes[i++]) ) {
				// Prepend if requested
				if ( dataType[0] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					(structure[ dataType ] = structure[ dataType ] || []).unshift( func );

				// Otherwise append
				} else {
					(structure[ dataType ] = structure[ dataType ] || []).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		});
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},
		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

		// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {
								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s[ "throws" ] ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: ajaxLocation,
		type: "GET",
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,
			// URL without anti-cache param
			cacheURL,
			// Response headers
			responseHeadersString,
			responseHeaders,
			// timeout handle
			timeoutTimer,
			// Cross-domain detection vars
			parts,
			// To know if global events are to be dispatched
			fireGlobals,
			// Loop variable
			i,
			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
				jQuery( callbackContext ) :
				jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks("once memory"),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// The jqXHR state
			state = 0,
			// Default abort message
			strAbort = "canceled",
			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( (match = rheaders.exec( responseHeadersString )) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					var lname = name.toLowerCase();
					if ( !state ) {
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( state < 2 ) {
							for ( code in map ) {
								// Lazy-add the new callback in a way that preserves old ones
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						} else {
							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR ).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" )
			.replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( rnotwhite ) || [ "" ];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? "80" : "443" ) ) !==
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? "80" : "443" ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
		fireGlobals = jQuery.event && s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger("ajaxStart");
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL = ( s.url += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			if ( s.cache === false ) {
				s.url = rts.test( cacheURL ) ?

					// If there is already a '_' parameter, set its value
					cacheURL.replace( rts, "$1_=" + nonce++ ) :

					// Otherwise add one to the end
					cacheURL + ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + nonce++;
			}
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
			// Abort if not done already and return
			return jqXHR.abort();
		}

		// Aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout(function() {
					jqXHR.abort("timeout");
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch ( e ) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader("Last-Modified");
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader("etag");
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {
				// Extract error from statusText and normalize for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// Shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		});
	};
});


jQuery._evalUrl = function( url ) {
	return jQuery.ajax({
		url: url,
		type: "GET",
		dataType: "script",
		async: false,
		global: false,
		"throws": true
	});
};


jQuery.fn.extend({
	wrapAll: function( html ) {
		var wrap;

		if ( jQuery.isFunction( html ) ) {
			return this.each(function( i ) {
				jQuery( this ).wrapAll( html.call(this, i) );
			});
		}

		if ( this[ 0 ] ) {

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstElementChild ) {
					elem = elem.firstElementChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function( i ) {
				jQuery( this ).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function( i ) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	}
});


jQuery.expr.filters.hidden = function( elem ) {
	// Support: Opera <= 12.12
	// Opera reports offsetWidths and offsetHeights less than zero on some elements
	return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;
};
jQuery.expr.filters.visible = function( elem ) {
	return !jQuery.expr.filters.hidden( elem );
};




var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {
		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );

			} else {
				// Item is non-scalar (array or object), encode its numeric index.
				buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
			}
		});

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {
		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		});

	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" ).replace( r20, "+" );
};

jQuery.fn.extend({
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map(function() {
			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		})
		.filter(function() {
			var type = this.type;

			// Use .is( ":disabled" ) so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		})
		.map(function( i, elem ) {
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val ) {
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		}).get();
	}
});


jQuery.ajaxSettings.xhr = function() {
	try {
		return new XMLHttpRequest();
	} catch( e ) {}
};

var xhrId = 0,
	xhrCallbacks = {},
	xhrSuccessStatus = {
		// file protocol always yields status code 0, assume 200
		0: 200,
		// Support: IE9
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	xhrSupported = jQuery.ajaxSettings.xhr();

// Support: IE9
// Open requests must be manually aborted on unload (#5280)
// See https://support.microsoft.com/kb/2856746 for more info
if ( window.attachEvent ) {
	window.attachEvent( "onunload", function() {
		for ( var key in xhrCallbacks ) {
			xhrCallbacks[ key ]();
		}
	});
}

support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport(function( options ) {
	var callback;

	// Cross domain only allowed if supported through XMLHttpRequest
	if ( support.cors || xhrSupported && !options.crossDomain ) {
		return {
			send: function( headers, complete ) {
				var i,
					xhr = options.xhr(),
					id = ++xhrId;

				xhr.open( options.type, options.url, options.async, options.username, options.password );

				// Apply custom fields if provided
				if ( options.xhrFields ) {
					for ( i in options.xhrFields ) {
						xhr[ i ] = options.xhrFields[ i ];
					}
				}

				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {
					xhr.overrideMimeType( options.mimeType );
				}

				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers["X-Requested-With"] ) {
					headers["X-Requested-With"] = "XMLHttpRequest";
				}

				// Set headers
				for ( i in headers ) {
					xhr.setRequestHeader( i, headers[ i ] );
				}

				// Callback
				callback = function( type ) {
					return function() {
						if ( callback ) {
							delete xhrCallbacks[ id ];
							callback = xhr.onload = xhr.onerror = null;

							if ( type === "abort" ) {
								xhr.abort();
							} else if ( type === "error" ) {
								complete(
									// file: protocol always yields status 0; see #8605, #14207
									xhr.status,
									xhr.statusText
								);
							} else {
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,
									// Support: IE9
									// Accessing binary-data responseText throws an exception
									// (#11426)
									typeof xhr.responseText === "string" ? {
										text: xhr.responseText
									} : undefined,
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};

				// Listen to events
				xhr.onload = callback();
				xhr.onerror = callback("error");

				// Create the abort callback
				callback = xhrCallbacks[ id ] = callback("abort");

				try {
					// Do send the request (this may raise an exception)
					xhr.send( options.hasContent && options.data || null );
				} catch ( e ) {
					// #14683: Only rethrow if this hasn't been notified as an error yet
					if ( callback ) {
						throw e;
					}
				}
			},

			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
});




// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /(?:java|ecma)script/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {
	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery("<script>").prop({
					async: true,
					charset: s.scriptCharset,
					src: s.url
				}).on(
					"load error",
					callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					}
				);
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
});




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always(function() {
			// Restore preexisting value
			window[ callbackName ] = overwritten;

			// Save back as free
			if ( s[ callbackName ] ) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});




// data: string of html
// context (optional): If specified, the fragment will be created in this context, defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( !data || typeof data !== "string" ) {
		return null;
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}
	context = context || document;

	var parsed = rsingleTag.exec( data ),
		scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[1] ) ];
	}

	parsed = jQuery.buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


// Keep a copy of the old load method
var _load = jQuery.fn.load;

/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	var selector, type, response,
		self = this,
		off = url.indexOf(" ");

	if ( off >= 0 ) {
		selector = jQuery.trim( url.slice( off ) );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax({
			url: url,

			// if "type" variable is undefined, then "GET" method will be used
			type: type,
			dataType: "html",
			data: params
		}).done(function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		}).complete( callback && function( jqXHR, status ) {
			self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
		});
	}

	return this;
};




// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
});




jQuery.expr.filters.animated = function( elem ) {
	return jQuery.grep(jQuery.timers, function( fn ) {
		return elem === fn.elem;
	}).length;
};




var docElem = window.document.documentElement;

/**
 * Gets a window from an element
 */
function getWindow( elem ) {
	return jQuery.isWindow( elem ) ? elem : elem.nodeType === 9 && elem.defaultView;
}

jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			( curCSSTop + curCSSLeft ).indexOf("auto") > -1;

		// Need to be able to calculate position if either
		// top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );

		} else {
			curElem.css( props );
		}
	}
};

jQuery.fn.extend({
	offset: function( options ) {
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each(function( i ) {
					jQuery.offset.setOffset( this, options, i );
				});
		}

		var docElem, win,
			elem = this[ 0 ],
			box = { top: 0, left: 0 },
			doc = elem && elem.ownerDocument;

		if ( !doc ) {
			return;
		}

		docElem = doc.documentElement;

		// Make sure it's not a disconnected DOM node
		if ( !jQuery.contains( docElem, elem ) ) {
			return box;
		}

		// Support: BlackBerry 5, iOS 3 (original iPhone)
		// If we don't have gBCR, just use 0,0 rather than error
		if ( typeof elem.getBoundingClientRect !== strundefined ) {
			box = elem.getBoundingClientRect();
		}
		win = getWindow( doc );
		return {
			top: box.top + win.pageYOffset - docElem.clientTop,
			left: box.left + win.pageXOffset - docElem.clientLeft
		};
	},

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is its only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {
			// Assume getBoundingClientRect is there when computed position is fixed
			offset = elem.getBoundingClientRect();

		} else {
			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset.top += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || docElem;

			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position" ) === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || docElem;
		});
	}
});

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : window.pageXOffset,
					top ? val : window.pageYOffset
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

// Support: Safari<7+, Chrome<37+
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://code.google.com/p/chromium/issues/detail?id=229280
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
jQuery.each( [ "top", "left" ], function( i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );
				// If curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
});


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// Margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});


// The number of elements contained in the matched element set
jQuery.fn.size = function() {
	return this.length;
};

jQuery.fn.andSelf = jQuery.fn.addBack;




// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.

// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

if ( typeof define === "function" && define.amd ) {
	define( "jquery", [], function() {
		return jQuery;
	});
}




var
	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( typeof noGlobal === strundefined ) {
	window.jQuery = window.$ = jQuery;
}




return jQuery;

}));

},{}],"/Users/REDLIST/Sites/fed-bingo/node_modules/underscore/underscore.js":[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}]},{},["./app/scripts/app.js"])


//# sourceMappingURL=app.js.map