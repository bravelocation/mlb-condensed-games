// For use in AWS Lambda function
const mlbApi = require("./mlb-api");

exports.handler = function(event, context, callback) {
    // Get the parameters from the post request
    console.log('Received event:', JSON.stringify(event, null, 2));

    if (event.gameDate === undefined || event.team === undefined) {
        console.log("Input error: " + JSON.stringify(event));
        callback("400 Invalid Input");
        return;
    }

    mlbApi.findCondensedGame(event.gameDate, event.team.toLowerCase(), function(gameDetails, error){
        if (error) {
            console.log("Error: " + error);
            callback("500 Internal Error");
        } else {
            console.log("Results: " + JSON.stringify(gameDetails));
            callback(null, gameDetails);
        }
    });
};