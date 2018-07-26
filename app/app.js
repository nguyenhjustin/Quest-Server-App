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
const client = redis.createClient(6379, "192.168.99.100");

client.on('connect', function() {
  console.log('Redis is now connected!\n');
 });

client.on('error', function(err) {
  console.log("Redis Error: " + err);
});

// // Uncomment this function to clear the database.
// client.flushdb( function(err, succeeded) {
//  console.log(succeeded);
// });

// Constants for the database.
const PlayerIdHashPrefix = "PlayerId:";
const TotalQuestPointsField = "TotalQuestPoints";
const LastMilestoneIndexField = "LastMilestoneIndex";

// Setup routes.
app.post('/api/progress', UpdateProgress);
app.get('/api/state/:PlayerId', GetState);

// Start the server.
var server = module.exports = app.listen(3000, function() {
  let host = server.address().address;
  let port = server.address().port;
  console.log("App listening at http://%s:%s", host, port);
});

server.on('close', function(err) {
  console.log("Server closed!");
});

function UpdateProgress(req, res)
{
  // TODO: Validate the body.
  let playerId = req.body.PlayerId;
  let playerLevel = req.body.PlayerLevel;
  let chipAmountBet = req.body.ChipAmountBet;
  console.log("Received POST for Player: " + playerId + ", Level: " + 
    playerLevel + ", Bet Amount: " + chipAmountBet + "!\n");

  let questPointsEarned = (chipAmountBet * RateFromBet) + 
    (playerLevel * LevelBonusRate);
  
  let totalQuestPoints = 0;
  let lastMilestoneIndex = 0;

  let totalQuestPercentCompleted;
  let milestonesCompleted = [];

  RetrieveDatabase(playerId)

  .then((object) => {
    if (object != null) {
      totalQuestPoints = object[TotalQuestPointsField];
      lastMilestoneIndex = object[LastMilestoneIndexField];
    }

    totalQuestPoints += questPointsEarned;
    totalQuestPercentCompleted = 
      (totalQuestPoints / QuestCompletionPoints) * 100;
    
    // TODO: Check if multiple milestones are completed and add them to the array.
    let pointsPerMilestone = QuestCompletionPoints / MilestonesPerQuest;

    for (let i = lastMilestoneIndex + 1; i <= MilestonesPerQuest; i++) {
      if (totalQuestPoints >= i * pointsPerMilestone) {
        milestonesCompleted.push({
          "MilestoneIndex": i, 
          "ChipsAwarded": MilestoneChipsAward 
        });
        lastMilestoneIndex = i;
      }
    }

    UpdateDatabase(playerId, totalQuestPoints, lastMilestoneIndex);
  })

  .then(() => {
    res.status(200).send({
      "QuestPointsEarned": questPointsEarned,
      "TotalQuestPercentCompleted": totalQuestPercentCompleted,
      "MilestonesCompleted": milestonesCompleted
    }); 
  })

  .catch(error => HandleError(res, 500, error));

}

function GetState(req, res)
{
  let playerId = req.params.PlayerId;
  console.log("Received GET with PlayerId: " + playerId + "!\n");

  RetrieveDatabase(playerId)

  .then((object) => {
    if (object == null) {
      return Promise.reject("PlayerId: " + playerId + " does not exist.");
    }

    let totalQuestPoints = object[TotalQuestPointsField];
    let lastMilestoneIndex = parseInt(object[LastMilestoneIndexField]);

    let totalQuestPercentCompleted = 
      (totalQuestPoints / QuestCompletionPoints) * 100;
  
    res.status(200).send({
      "TotalQuestPercentCompleted": totalQuestPercentCompleted,
      "LastMilestoneIndexCompleted": lastMilestoneIndex
    }); 
  })

  .catch(error => HandleError(res, 500, error));

}

/**
 * Checks that the quest config file contains valid values.
 */
function ValidateQuestConfig()
{
    // TODO: Check for negative numbers.
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

function UpdateDatabase(playerId, totalQuestPoints, lastMilestoneIndex) {
  return new Promise((resolve, reject) => {
    client.HMSET(
      PlayerIdHashPrefix + playerId, 
      TotalQuestPointsField, totalQuestPoints, 
      LastMilestoneIndexField, lastMilestoneIndex, (err, status) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(status);
        }
    });
  });
}

function RetrieveDatabase(playerId) {
  return new Promise((resolve, reject) => {
    client.HGETALL(PlayerIdHashPrefix + playerId, (err, status) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(status);
      }
    });
  });
}

/**
 * Responds an error back to the client.
 * @param {Response} res 
 * @param {integer} statusCode 
 * @param {string} error 
 */
function HandleError(res, statusCode, error) {
  console.log("Error: " + error);
  res.status(statusCode).send( { "error": error } );
}