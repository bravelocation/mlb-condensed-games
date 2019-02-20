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

        // Find any matching games
        const games = gameData.games.game;

        if (games == null) {
            const response = {
                opponent: opponent,
                date: dateParameter,
                url: null	
            };
    
            callback(response, null); 
            return;           
        }

        for (var i = 0; i < games.length; i++) {
            const game = games[i];

            const homeCode = game["$"].home_file_code;
            const awayCode = game["$"].away_file_code;
            const gameDirectory = game["$"].game_data_directory;

            if (homeCode == teamParameter || awayCode == teamParameter) {
                // Found a matching game
                gameDirectoryUrl = "http://gd2.mlb.com" + gameDirectory + "/media/mobile.xml";

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
            findCondensedGame(gameDirectoryUrl, function(gameData, error){
                if (error) {
                    callback(null, error);
                    return;
                }

                var mediaUrl = null;

                const mediaNodes = gameData.highlights.media;

                if (mediaNodes) {
                    for (var i = 0; i < mediaNodes.length; i++) {
                        const media = mediaNodes[i];
                        const mediaType = media["$"]["media-type"];
            
                        if (mediaType == "C") {
                            // Found condensed media, so find the correct media type
                            const mediaUrls = media.url;
    
                            for (var j = 0; j < mediaUrls.length; j++) {
                                const currentMediaUrl = mediaUrls[j]["_"];
    
                                if (currentMediaUrl.endsWith(".mp4")) {
                                    mediaUrl = currentMediaUrl;
                                    break;
                                }
                            }
                        }
                    }  
                }
             
                const response = {
                    opponent: opponent,
                    date: dateParameter,
                    url: mediaUrl	
                };

                callback(response, null);
            });
        } else {
            const response = {
                opponent: opponent,
                date: dateParameter,
                url: null	
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

function findCondensedGame(gameDataUrl, callback) {
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



module.exports = MlbAPI;