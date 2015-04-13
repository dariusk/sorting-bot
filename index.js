var _ = require('underscore');
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

wordfilter.addWords(['rape']);

Array.prototype.pick = function() {
  return this[Math.floor(Math.random()*this.length)];
};

Array.prototype.pickRemove = function() {
  var index = Math.floor(Math.random()*this.length);
  return this.splice(index,1)[0];
};

function house() {
  return [
    'Slytherin',
    'Hufflepuff',
    'Ravenclaw',
    'Gryffindor'
  ].pick();
}

function getAdj101(words) {
  var results = _.chain(words)
    .map(function(el) {
      var stress = r.getStresses(el);
      var pos = r.getPosTags(el)[0];
      if (stress === '1') {
        el = ['very ','rather ','really '].pick() + el;
        stress = '1/0/1';
      }
      else if (stress === '0/1') {
        el = ['so ','not ','quite '].pick() + el;
        stress = '1/0/1';
      }
      return {
        word: el,
        stress: stress,
        pos: pos
      };
    })
    // just get the meter and PoS we want
    .filter(function(el) {
      return el.stress === '1/0/1' && el.pos === 'jj'
            && el.word.match(/\sfat/) === null;
    })
    .value();
  if (results.length === 0) return null;
  var result = results.pick().word;
  return result;
}

function getNouns1(words) {
  var result = _.chain(words)
    .map(function(el) {
      var stress = r.getStresses(el);
      var pos = r.getPosTags(el)[0];
      return {
        word: el,
        stress: stress,
        pos: pos
      };
    })
    // just get the meter and PoS we want
    .filter(function(el) {
      console.log(el.pos, el.word, el.stress);
      return el.stress === '1' && el.pos === 'nn';
    })
    .value();
  return result;
}

function a(word) {
  var first = r.getPhonemes(word)[0];
  if (first === 'a'
    || first === 'e'
    || first === 'i'
    || first === 'o'
    || first === 'u') {
    return 'an ' + word;
  }
  else {
    return 'a ' + word;
  }
}

// accepts a stress-tagged array of objects, [{ foo: bar, stress: '1/1/0'}]
function getStress(list, stress) {
  return _.chain(list)
    .filter(function(el) {
      return el.stress === stress;
    })
    .value();
}

function getWord(pos, stress) {
  var word = lexicon.randomWord();
  var word_stress = r.getStresses(word);
  var word_pos = r.getPosTags(word)[0];
  if (stress === word_stress && pos === word_pos) {
    return word;
  }
  else {
    return getWord(pos, stress);
  }
}

function filterPosStress(words, pos, stress) {
    return _.filter(words, function(word) {
      return r.getPosTags(word)[0] === pos && r.getStresses(word) === stress;
    });
}

function getCouplet(pos1, stress1, pos2, stress2) {
  var result;
  // get our first word, arbitrary
  var word1 = getWord(pos1, stress1);
  // get rhymes for first word
  var rhymes = lexicon.rhymes(word1);
  // if no rhymes, return null
  if (rhymes.length === 0) {
    result = null;
  }
  else {
    // reduce to just rhymes that match our pos and stress
    var results = filterPosStress(rhymes, pos2, stress2);
    //if no matching rhymes, return null
    if (results.length === 0) {
      result = null;
    }
    else {
      var word2 = results.pick();
      result = [word1, word2];
    }
  }
  if (result !== null) {
    return result;
  }
  else {
    return getCouplet(pos1, stress1, pos2, stress2);
  }
}

function getPartner(word, pos2, stress2) {
  var result;
  // get our first word, arbitrary
  var word1 = word;
  // get rhymes for first word
  var rhymes = lexicon.rhymes(word1);
  // if no rhymes, return null
  if (rhymes.length === 0) return null;

  // reduce to just rhymes that match our pos and stress
  var results = filterPosStress(rhymes, pos2, stress2);
  //if no matching rhymes, return null
  if (results.length === 0) return null;
  var word2 = results.pick();
  return [word1, word2];
}

function phraseAnimals() {
  var result;
  var adjs = ['cunning','stinging','body','bravery','prowess','anger','wisdom','ethic'];
  var cunning = adjs.pickRemove();
  var stinging = adjs.pickRemove();
  // get a 1/0/1 animal
  var thing = getStress(animals,'1/0/1');
  thing = thing.pick().name;
  // get a random one syllable animal
  var first = getStress(animals,'1');
  first = first.pick().name;
  var rhymes = lexicon.rhymes(first);
  var word = getAdj101(rhymes);
  if (word === null) {
    result = null;
  }
  else {
    var res = 'The ' + cunning + ' of ' + a(thing) + ', the ' + stinging + ' of ' + a(first) + '\n' + housePhrase() + ' ' + ['for','since'].pick() + ' you are ' + word;
    result = res;
  }
  if (result !== null) {
    return result;
  }
  else {
    return phraseAnimals();
  }
}

function generate() {
  var res = [
    phraseAnimals,
    phrase,
    phrase2,
    phrase3,
    phrase4,
    phrase5
  ].pick().call();
  if (!wordfilter.blacklisted(res)) {
    return res;
  }
  else {
    return generate();
  }
}

function hat() {
  var adj10 = getWord('jj','1/0');
  var res = [
    'I am the '+adj10+ ' Sorting Hat',
    'I am the Hogwarts Sorting Hat',
    'The Sorting Hat is who I am',
    'You stand before the Sorting Hat',
    'The Sorting time is here at last'
  ].pick();
  return res;
}

function housePhrase() {
  var res = [
    'I\'m putting you in ' + house(),
    'Today you join with ' + house(),
    'Your future lies with ' + house(),
    'To ' + house() + ' I add your name',
    'In ' + house() + ' is where you go',
    'In ' + house() + ' you do belong',
    'For ' + house() + ' you cast your lot'
  ].pick();
  return res;
}
function phrase() {
  var words = getCouplet('nn','1','jj','1');
  var noun1 = words[0];
  var noun1a = getWord('nn','1');
  var adj1 = words[1];
  var res = hat() + ', ' + ['gaze upon','look upon'].pick() + ' my ' + noun1 + '\n' + housePhrase() + ' because your ' + noun1a + ' is ' + adj1;
  return res;
}

function phrase2() {
  var result;
  var adj1 = getWord('jj','1');
  var rhymes = lexicon.rhymes(adj1);
  var adj101 = getAdj101(rhymes);
  if (adj101 === null) {
    result = null;
  }
  else {
    var noun101 = getWord('nn','1/0/1');
    var res = hat() + ', my ' + noun101 + ' is ' + adj1 + '\n' + housePhrase() + ', ' + ['for','since'].pick() + ' you are ' + adj101;
    result = res;
  }
  if (result !== null) {
    return result;
  }
  else {
    return phrase2();
  }
}

function phrase3() {
  var words = getCouplet('vb','1','nn','1');
  //var adv10 = getWord('rb','1/0');
  var verb1 = words[0];
  var noun1 = words[1];
  var res = hat() + ', ' + ['I see you when you','I\'m watching when you', 'I know each time you'].pick() + ' ' + verb1 + '\n' + ['So I deduce that ', 'I\'ve figured out that ', 'It\'s plain to see that ','And thus we know that '].pick() + house() + '\'s ' + ['the right place for your', 'the house to put your'].pick() + ' ' + noun1;
  return res;
}

function phrase4() {
  var made = ['made','born','here'].pick();
  var words = getPartner(made,'jj','0/1');
  var bodyParts1 = getStress(bodyParts, '1');
  var noun1 = bodyParts1.pickRemove().word;
  var noun1a = bodyParts1.pickRemove().word;
  var adj1 = getWord('jj','1');
  var adj01 = getWord('jj','0/1');
  var adj101 = words[1];
  var adj010 = getWord('jj','0/1/0');
  var res = 'Your ' + noun1 + ' is ' + adj1 + ', your ' + noun1a + ' ' + adj01 + ', yet you are '+['so','not'].pick()+' ' + adj101 + '\nFrom this ' + adj010 + ' recipe, a ' + house() + ' is ' + made + '!';
  return res;
}

function phrase5() {
  var houses = [
    { name: 'Gryffindor', rhyme: 'door' },
    { name: 'Hufflepuff', rhyme: 'puff' },
    { name: 'Ravenclaw', rhyme: 'claw' },
    { name: 'Slytherin', rhyme: 'spin' }
  ];
  var house = houses.pick();
  var made = ['made','born','here'].pick();
  var words = getPartner(house.rhyme,'nn','1');
  var noun1_house = words[1];
  var noun1 = getWord('nn','1');
  var noun1a = getWord('nn','1');
  var noun101 = getWord('nn','1/0/1');
  var res = 'Your ' + noun101 + ' is like ' + a(noun1) + ', your ' + noun1a + ' is like ' + a(noun1_house) + '\n' + ['This fateful day\'s the day you join','From this day forth a member of','Your future lies with those inside'].pick() + ' the house of ' + house.name + '!'
  return res;
}

function tweet() {
  generate().then(function(myTweet) {
    if (!wordfilter.blacklisted(myTweet)) {
      console.log(myTweet);
      /*
      T.post('statuses/update', { status: myTweet }, function(err, reply) {
        if (err) {
          console.log('error:', err);
        }
        else {
          console.log('reply:', reply);
        }
      });
      */
    }
  });
}

console.log('START');

function popQueue() {
// pop the queue
client.lpop('queue', function(err, reply) {
  console.log('next is', reply);
  // if null, ignore
  if (reply !== null) {
    // if not null, check if we've already tweeted
    client.exists('&'+reply, function(err, doesExist) {
      console.log('exists:', doesExist);
      // if we haven't already tweeted, tweet and add to never-tweet hash
      if (!doesExist) {
        // TWEET
        var myTweet = generate();
        var person = reply
        if (person[0] === '@') {
          person = person.substr(1,1000);
        }
        myTweet = '@' + person + ' ' + myTweet;
        console.log('THE TWEET:', myTweet);
        T.post('statuses/update', { status: myTweet }, function(err, reply) {
          if (err) {
            console.log('error:', err);
            // close connection and program
            client.end();
          }
          else {
            console.log('reply:', reply);
            // add follower to a never-tweet-again key (add & to protect against users with names like @queue)
            client.set('&'+person, '1', redis.print);
            client.end();
          }
        });
      }
      else {
        popQueue();
      }
    });
  }
});
}

popQueue();
