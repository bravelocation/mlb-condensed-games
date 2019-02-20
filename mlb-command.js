const mlbApi = require("./mlb-api");

// Read date and team from command line

if (process.argv.length < 4) {
    console.log("Usage: node mlb-command.js [yyyy-MM-dd] [nym]");
    process.exit();
}

const dateParameter = process.argv[2];
const teamParameter = process.argv[3].toLowerCase();

mlbApi.findCondensedGame(dateParameter, teamParameter, function(gameDetails, error){
    if (error) {
        console.log("ERROR:"  + error);
    } else {
        console.log("Game details: " + JSON.stringify(gameDetails));
    }

});

