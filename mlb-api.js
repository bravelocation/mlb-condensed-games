const request = require("request");
const xml2js = require('xml2js');

var MlbAPI = function () {};

// Function that sends error message via Slack
MlbAPI.findCondensedGame = function (dateParameter, teamName, callback) {

    findGamesOnDate(dateParameter, function(gameData, error) {
        if (error) {
            console.log("Error accessing game data");
            callback(null, error);
            return;
        }

        let opponent = null;
        let gameDirectoryUrl = null;

        if (gameData.dates == null) {
            const response = {
                opponent: opponent,
                date: dateParameter,
                url: null	
            };
    
            callback(response, null); 
            return;           
        }

        // Find any matching games
        const dates = gameData.dates;

        for (var d = 0; d < dates.length; d++) {
            const date = dates[d];

            if (date.date === dateParameter) {
                const games = date.games;

                for (var i = 0; i < games.length; i++) {
                    const game = games[i];
                    const gamePk = game.gamePk;

                    var awayTeamName = game.teams.away.team.name;
                    var homeTeamName = game.teams.home.team.name;
        
                    if (homeTeamName.toLowerCase() === teamName.toLowerCase() || awayTeamName.toLowerCase() === teamName.toLowerCase()) {
                        // Found a matching game
                        gameDirectoryUrl = "https://statsapi.mlb.com/api/v1/game/" + gamePk + "/content?language=en";
        
                        if (homeTeamName === teamName) {
                            opponent = awayTeamName;
                        } else {
                            opponent = homeTeamName;
                        }
        
                        break;
                    }
                }
            }
        }

        if (gameDirectoryUrl) {
            // We have a game, so go see if there is a condensed game
            findGameMedia(gameDirectoryUrl, function(gameData, error){
                if (error) {
                    callback(null, error);
                    return;
                }

                var mediaUrl = null;
                var mediaType = null;

                if (gameData.media && gameData.media.epgAlternate) {
                    const epgNodes = gameData.media.epgAlternate;

                    for (var e = 0; e < epgNodes.length; e++) {

                        const epgNode = epgNodes[e];

                        if (epgNode.title == "Extended Highlights") {
                            const highlights = epgNode.items;

                            for (var i = 0; i < highlights.length; i++) {
                                var highlightNode = highlights[i];
        
                                // If it is a condensed game video, return the mp4 media node
                                if (highlightNode.type == "video") {
                                    const mediaNodes = highlightNode.playbacks;
        
                                    for (var m = 0; m < mediaNodes.length; m++) {
                                        const mediaNode = mediaNodes[m];
        
                                        if (mediaNode.url.endsWith(".mp4") && mediaNode.name == "mp4Avc") {
                                            mediaUrl = mediaNode.url;
                                            mediaType = epgNode.title;
                                            break;
                                        }
                                    }
        
                                    // Found condensed game, so we are done
                                    break;
                                }
                            }

                            // Found condensed media, so we are done
                            if (mediaUrl) {
                                break;
                            }
                        }
                    }
                }
 
                const response = {
                    opponent: opponent,
                    date: dateParameter,
                    url: mediaUrl,
                    mediaType: mediaType	
                };

                callback(response, null);
            });
        } else {
            const response = {
                opponent: opponent,
                date: dateParameter,
                url: null,
                mediaType: null	
            };
    
            callback(response, null);            
        }
    });
};

function findGamesOnDate(dateParameter, callback) {
    // Make the URL
    const dateParts = dateParameter.split("-");

    if (dateParts.length != 3) {
        callback(null, "Invalid date format");
    }

    const gameDataUrl = 'https://statsapi.mlb.com/api/v1/schedule?sportId=1,51&date=' + dateParameter;

    console.log("Game Data URL: " + gameDataUrl);

    request(
        {
            uri: gameDataUrl, 
            method: "GET", 
            timeout: 5000, 
            followRedirect: false
        }, 
        function(error, response, body) {
            if (error) {
                callback(null, error);
                return;
            }

            // Otherwise return the JSON
            callback(JSON.parse(body), null);
        });  
};

function findGameMedia(gameDataUrl, callback) {
    console.log("Media Data URL: " + gameDataUrl);
    request(
        {
            uri: gameDataUrl, 
            method: "GET", 
            timeout: 5000, 
            followRedirect: false
        }, 
        function(error, response, body) {
            if (error) {
                callback(null, error);
                return;
            }

            // Otherwise return the JSON
            callback(JSON.parse(body), null);
        });  
};



module.exports = MlbAPI;