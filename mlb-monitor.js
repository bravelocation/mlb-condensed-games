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

    var lastDateFetched = null;

    s3Client.getObject(params, function(err, data) {
        if (err) {
            console.log("Error fetching data file from S3: " + err);
            // No data file so start at random date for now
            lastDateFetched = "2018-09-27";
        } else {
            var buffer = Buffer.from(data.Body);
            var json = buffer.toString("utf8");
            var dataFile = JSON.parse(json);
            lastDateFetched = dataFile.date;           
        }

        console.log("Last fetched date: " + lastDateFetched);

        // If date is == today, we are good
        var today = new Date();

        if (formatDate(today) == lastDateFetched) {
            return;
        }
        
        var yesterday =  new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        var gameDate = "";

        if (formatDate(yesterday) == lastDateFetched) {
            // Try today
            gameDate = formatDate(today);
        } else {
            // Try yesterday
            gameDate = formatDate(yesterday);
        }

        mlbApi.findCondensedGame(gameDate, team.toLowerCase(), function(gameDetails, error){
            if (error) {
                console.log("Error: " + error);
                callback("Error finding condensed game");
            } else {
                console.log("Results: " + JSON.stringify(gameDetails));

                // If we have a full set of data, save it and send the Slack message
                if (gameDetails.opponent && gameDetails.date && gameDetails.url) {
                    // Send Slack message
                    const message = "New condensed game vs " + gameDetails.opponent + "\n" + gameDetails.url;
                    sendSlackMessage(slackWebHook, message);

                    // Send IFTTT notification message
                    sendIFTTTMessage("New condensed game vs " + gameDetails.opponent + " available", gameDetails.url);

                    s3Client.putObject({
                        Bucket: s3DataBucket,
                        Key: s3DataFile,
                        ACL: 'private',
                        ContentType: 'application/json',
                        Body: JSON.stringify(gameDetails)
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

function sendIFTTTMessage(messageText, videoLink) {
    var formData = { 
        "value1" : messageText, 
        "value2" : "MLB Condensed Game", 
        "value3" : videoLink
    };

    const iftttEvent = process.env.IFTTT_EVENT_NAME;
    const iftttMakerKey = process.env.IFTTT_MAKER_KEY;

    // Call IFTTT with data
    request.post({
            url: "https://maker.ifttt.com/trigger/" + iftttEvent + "/with/key/" + iftttMakerKey, 
            formData: formData}, function optionalCallback(err, httpResponse, body) {
    if (err) {
        textResponse('Uploaded to IFTTT failed', callback);
    } else {
        textResponse('Upload successful!', callback);
    }
    });
}

function formatDate(date) {
    var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

module.exports = MlbMonitor;