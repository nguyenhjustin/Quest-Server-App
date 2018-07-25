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
  let playerId1 = "playerId1";

  it('update progress', function(done) {
    let options = GetOptionsForUpdateProgress(playerId1, 2, 10);
    request.post(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      console.log(body);
      done();
    });
  });

  // it('update progress quest already complete', function(done) {
  //   let options = GetOptionsForUpdateProgress(playerId1, 2, 10);
  //   request.post(options, function(err, res, body) {
  //     expect(res.statusCode).to.equal(200);
  //     console.log(body);
  //     done();
  //   });
  // });

  it('get state', function(done) {
    let options = GetOptionsForGetState(playerId1);
    request.get(options, function(err, res, body) {
      expect(res.statusCode).to.equal(200);
      expect(body.TotalQuestPercentCompleted).to.equal(26);
      expect(body.LastMilestoneIndexCompleted).to.equal(1);
      done();
    });
  });

  it("get state playerId doesn't exist", function(done) {
    let options = GetOptionsForGetState("doesNotExistId");
    request.get(options, function(err, res, body) {
      expect(res.statusCode).to.equal(500);
      console.log(body.error);
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