const request = require('request');
const expect = require('chai').expect;

//const Address = "http://192.168.99.100:3000";
const Address = "http://localhost:3000";

var server;

before(function() {
  server = require('../app.js');
});

after(function() {
  server.close();
});

describe('quest server backend tests', function () {

  it('update progress', function(done) {
    var options = GetOptionsForUpdateProgress("id1", 2, 10);
    request.post(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      console.log(body);
      done();
    });
  });

  it('get state', function(done) {
    var options = GetOptionsForGetState("id1");
    request.get(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      console.log(body);
      done();
    });
  });

});

function GetOptionsForUpdateProgress(playerId, playerLevel, chipAmountBet) {
  return {
    url: Address + "/api/progress", 
    json: {
      "PlayerId": playerId,
      "PlayerLevel": playerLevel,
      "ChipAmountBet": chipAmountBet
    }
  };
}

function GetOptionsForGetState(playerId) {
  return {
    url: Address + "/api/state/" + playerId, 
    json: true
  };
}