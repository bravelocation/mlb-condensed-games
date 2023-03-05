const mlbApi = require("./mlb-api");

// Read date and team from command line
if (process.argv.length < 4) {
    console.log("Usage: node mlb-command.js [yyyy-MM-dd] [New York Mets]");
    process.exit();
}

const dateParameter = process.argv[2];
const teamName = process.argv[3].toLowerCase();

mlbApi.findCondensedGame(dateParameter, teamName, function(gameDetails, error){
    if (error) {
        console.log("ERROR:"  + error);
    } else {
        console.log("Game details: " + JSON.stringify(gameDetails));
    }
});

