const express = require('express');
const app = express();
app.use(express.json());

// Read the quest configuration file.
var RateFromBet;
var LevelBonusRate;
var QuestCompletionPoints;
var MilestonesPerQuest;
var MilestoneChipsAward;
const questConfig = require('./questConfig.json');
ValidateQuestConfig();

// Connect to the database.
const redis = require('redis');
//const client = redis.createClient(6379, 'redis');
//const client = redis.createClient(6379, "192.168.99.100");

// client.on('connect', function() {
//   console.log('Redis is now connected!\n');
//  });

// client.on('error', function(err) {
//   console.log("Redis Error: " + err);
// });

// // Uncomment this function to clear the database.
// client.flushdb( function(err, succeeded) {
//  console.log(succeeded);
// });

// Setup routes.
app.post('/api/progress', UpdateProgress);
app.get('/api/state/:PlayerId', GetState);

// Start the server.
var server = module.exports = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log("App listening at http://%s:%s", host, port);
});

server.on('close', function(err) {
  console.log("Server closed!");
});

function UpdateProgress(req, res)
{
  // TODO: Validate the body.
  var playerId = req.body.PlayerId;
  var playerLevel = req.body.PlayerLevel;
  var chipAmountBet = req.body.ChipAmountBet;
  console.log("Received POST for Player: " + playerId + ", Level: " + 
    playerLevel + ", Bet Amount: " + chipAmountBet + "!\n");

  var questPointsEarned = 2;
  var totalQuestPercentCompleted = 20;
  var milestonesCompleted = [];

  // TODO: Check if multiple milestones are completed and add them to the array.
  var milestoneIndex = 3;
  milestonesCompleted.push({
    "MilestoneIndex": milestoneIndex, 
    "ChipsAwarded": MilestoneChipsAward 
  });
  
  res.status(200).send({
    "QuestPointsEarned": questPointsEarned,
    "TotalQuestPercentCompleted": totalQuestPercentCompleted,
    "MilestonesCompleted": milestonesCompleted
  }); 
}

function GetState(req, res)
{
  var playerId = req.params.PlayerId;
  console.log("Received GET with PlayerId: " + playerId + "!\n");

  var totalQuestPercentCompleted = 70;
  var lastMilestoneIndexCompleted = 4;

  res.status(200).send({
    "TotalQuestPercentCompleted": totalQuestPercentCompleted,
    "LastMilestoneIndexCompleted": lastMilestoneIndexCompleted
  }); 
}

/**
 * Checks that the quest config file contains valid values.
 */
function ValidateQuestConfig()
{
  RateFromBet = questConfig.RateFromBet;
  LevelBonusRate = questConfig.LevelBonusRate;
  QuestCompletionPoints = questConfig.QuestCompletionPoints;
  MilestonesPerQuest = questConfig.MilestonesPerQuest;
  MilestoneChipsAward = questConfig.MilestoneChipsAward;

  if (isNaN(RateFromBet) || isNaN(LevelBonusRate))
  {
    console.log("RateFromBet and LevelBonusRate must be numbers.\n");
    process.exit(1);
  }

  if (!Number.isInteger(QuestCompletionPoints) ||
    !Number.isInteger(MilestonesPerQuest) ||
    !Number.isInteger(MilestoneChipsAward)) 
  {
    console.log("QuestCompletionPoints, MilestonesPerQuest, and " +
      "MilestoneChipsAward must be integers.\n");
    process.exit(1);
  }

  // TODO: Instead of exiting, default values could be used instead.
}