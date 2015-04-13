var _ = require('underscore');
_.mixin( require('underscore.deferred') );
var inflection = require('inflection');
var Twit = require('twit');
var T = new Twit(require('./config.js'));
var wordfilter = require('wordfilter');
var rita = require('rita');
var lexicon = new rita.RiLexicon();
var r = rita.RiTa;
var corpora = require('corpora-project');
var animals = require('./animals.js');//corpora.getFile('animals','common').animals;
var bodyParts = require('./bodyParts.js');
var redis = require('redis'), client = redis.createClient();

Array.prototype.pick = function() {
  return this[Math.floor(Math.random()*this.length)];
};

Array.prototype.pickRemove = function() {
  var index = Math.floor(Math.random()*this.length);
  return this.splice(index,1)[0];
};

console.log('START');
var stream = T.stream('user');

stream.on('follow', function (eventMsg) {
  var name = eventMsg.source.name;
  var screenName = eventMsg.source.screen_name;
  console.log(eventMsg);
  console.log(name, screenName);
  // add new followers to the queue
  client.rpush('queue', screenName, redis.print);
});
