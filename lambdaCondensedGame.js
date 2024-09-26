// For use in AWS Lambda function
const mlbApi = require("./mlb-api");

exports.handler = function(event, context, callback) {
    const apiHeader = event.headers.MLBAPIRequest || event.headers.mlbapirequest;

    // Check the request has a valid header
    if (apiHeader == null) {
        console.log("Input error: missing Header" + JSON.stringify(event.headers));
        callback("400 Invalid Input");
        return;       
    }

    if (apiHeader != process.env.MLBAPIRequest) {
        console.log("Input error: invalid Header:" + JSON.stringify(event.headers));
        callback("400 Invalid Input");
        return;       
    }

    // Get the parameters from the post request
    const inputParameters = JSON.parse(event.body);
    const team = inputParameters.params.team;

    if (gameDate === undefined || team === undefined) {
        console.log("Input error: " + JSON.stringify(inputParameters));
        callback("400 Invalid Input");
        return;
    }

    mlbApi.findCondensedGameFromYouTube(team.toLowerCase(), function(gameDetails, error){
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