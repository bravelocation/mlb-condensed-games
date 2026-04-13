const request = require("request");
const xml2js = require('xml2js');

var MlbAPI = function () {};

MlbAPI.findCondensedGameFromYouTube = function (teamName, callback) {
    const channelID = 'UCoLrcjPV5PbUrUyXq5mjc_A';
    const url = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + channelID;

    // Fetch the RSS feed from url
    request(
        {
            uri: url, 
            method: "GET", 
            timeout: 5000, 
            followRedirect: false
        }, 
        function(error, response, body) {
            if (error) {
                callback(null, error);
                return;
            }

            // Parse the XML
            xml2js.parseString(body, function (err, result) {
                if (err) {
                    callback(null, err);
                    return;
                }

                // Find the first video that matches the team name
                const entries = result.feed.entry;

                for (var i = 0; i < entries.length; i++) {
                    const entry = entries[i];
                    const title = entry.title[0];
                    const videoUrl = entry.link[0].$.href;
                    const id = entry.id[0];

                    if (title.toLowerCase().includes(teamName.toLowerCase()) && title.toLowerCase().includes("mlb") && title.toLowerCase().includes("game highlights")) {
                        const response = {
                            title: title,
                            url: videoUrl,
                            id: id
                        };

                        callback(response, null);
                        return;
                    }
                }

                callback(null, null);
            });
        });
};

module.exports = MlbAPI;