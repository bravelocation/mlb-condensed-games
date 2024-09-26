const IncomingWebhook = require('@slack/client').IncomingWebhook;
const AWS = require('aws-sdk');
const request = require('request');
const mlbApi = require("./mlb-api");

var MlbMonitor = function () {};

MlbMonitor.checkForChanges = function(callback) {
    // Pick up the settings from env
    const s3AccessKeyID = process.env.S3ACCESSKEYID;
    const s3SecretAccessKey = process.env.S3SECRETACCESSKEY;
    const s3DataBucket = process.env.S3DATABUCKET;
    const s3DataFile = process.env.S3DATAFILE;
    const slackWebHook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
    const team = process.env.TEAM;

    // Set the AWS config
    const awsConfig = {
        accessKeyId: s3AccessKeyID,
        secretAccessKey: s3SecretAccessKey
    }
    AWS.config.update(awsConfig);
    const s3Client = new AWS.S3();

    // Try to get data file
    var params = {
        Bucket: s3DataBucket,
        Key: s3DataFile
    };

    var lastID = "";

    s3Client.getObject(params, function(err, data) {
        if (err) {
            console.log("Error fetching data file from S3: " + err);
            // No data file so start at random date for now
            lastID = "";
        } else {
            var buffer = Buffer.from(data.Body);
            var json = buffer.toString("utf8");
            var dataFile = JSON.parse(json);
            lastID = dataFile.id;           
        }

        console.log("Last ID: " + lastID);

        mlbApi.findCondensedGameFromYouTube(team.toLowerCase(), function(gameDetails, error){
            if (error) {
                console.log("Error: " + error);
                callback("Error finding condensed game");
            } else {
                const responseData = gameDetails == null ? {} : gameDetails;
                console.log("Results: " + JSON.stringify(responseData));

                // If we have a full set of data, save it and send the Slack message unless the ID matches the last one
                if (responseData.title && responseData.id && responseData.url && responseData.id !== lastID) {
                    // Send Slack message
                    const message = responseData.title + "\n" + responseData.url;
                    sendSlackMessage(slackWebHook, message);

                    s3Client.putObject({
                        Bucket: s3DataBucket,
                        Key: s3DataFile,
                        ACL: 'private',
                        ContentType: 'application/json',
                        Body: JSON.stringify(responseData)
                    }, function(err, data) { 
                        if (err) {
                            callback(null, "Updated but not saved");
                        } else {
                            callback(null, "Updated");                            
                        }
                    });
                } else {
                    callback(null, "No updates");
                }
            }
        });
    });
};

function sendSlackMessage(slackWebHook, message) {
    slackWebHook.send(message, function(err, res) {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Message sent: ', res);
        }
    });
}

module.exports = MlbMonitor;
