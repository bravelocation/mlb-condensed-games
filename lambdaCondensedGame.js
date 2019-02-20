// For use in AWS Lambda function
const mlbApi = require("./mlb-api");

exports.handler = function(event, context, callback) {
    // Get the parameters from the post request
    console.log('Received event:', JSON.stringify(event, null, 2));

    console.log('Body:' + event.body);

    const inputParameters = JSON.parse(event.body);
    const gameDate = inputParameters.params.gameDate;
    const team = inputParameters.params.team;

    if (gameDate === undefined || team === undefined) {
        console.log("Input error: " + JSON.stringify(inputParameters));
        callback("400 Invalid Input");
        return;
    }

    mlbApi.findCondensedGame(gameDate, team.toLowerCase(), function(gameDetails, error){
        if (error) {
            console.log("Error: " + error);
            callback("500 Internal Error");
        } else {
            console.log("Results: " + JSON.stringify(gameDetails));

            var response = {
                "statusCode": 200,
                "body": JSON.stringify(gameDetails),
                "isBase64Encoded": false
            };

            callback(null, response);
        }
    });
};