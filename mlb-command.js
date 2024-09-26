const mlbApi = require("./mlb-api");

// Read date and team from command line
if (process.argv.length < 3) {
    console.log("Usage: node mlb-command.js [Mets]");
    process.exit();
}

const teamName = process.argv[2].toLowerCase();

mlbApi.findCondensedGameFromYouTube(teamName, function(gameDetails, error){
    if (error) {
        console.log("ERROR:"  + error);
    } else {
        const responseData = gameDetails == null ? {} : gameDetails;

        console.log("Game details: " + JSON.stringify(responseData));
    }
});

