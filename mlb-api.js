const request = require("request");
const xml2js = require('xml2js');

var MlbAPI = function () {};

// Function that sends error message via Slack
MlbAPI.findCondensedGame = function (dateParameter, teamParameter, callback) {

    findGamesOnDate(dateParameter, function(gameData, error) {
        if (error) {
            console.log("Error accessing game data");
            callback(null, error);
            return;
        }

        let opponent = null;
        let gameDirectoryUrl = null;

        if (gameData.games == null || gameData.games.game == null) {
            const response = {
                opponent: opponent,
                date: dateParameter,
                url: null	
            };
    
            callback(response, null); 
            return;           
        }

        // Find any matching games
        const games = gameData.games.game;

        for (var i = 0; i < games.length; i++) {
            const game = games[i];

            const homeCode = game["$"].home_file_code;
            const awayCode = game["$"].away_file_code;
            const game_pk = game["$"].game_pk;

            if (homeCode == teamParameter || awayCode == teamParameter) {
                // Found a matching game
                gameDirectoryUrl = "https://statsapi.mlb.com/api/v1/game/" + game_pk + "/content?language=en";

                if (homeCode == teamParameter) {
                    opponent = awayCode;
                } else {
                    opponent = homeCode;
                }

                break;
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

                        if (epgNode.title == "Extended Highlights" || epgNode.title == "Daily Recap") {
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

    const year = dateParts[0];
    const month = dateParts[1];
    const day = dateParts[2];

    const gameDataUrl = "http://gd2.mlb.com/components/game/mlb/year_" + year + "/month_" + month + "/day_" + day + "/master_scoreboard.xml";
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

            // Otherwise let's parse the XML and return it as JSON
            xml2js.parseString(body, function(err, data){
                callback(data, err);
            });
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