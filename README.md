# MLB Condensed Games

A few functions to look for MLB Condensed Games from their YouTube channel at https://www.youtube.com/@MLB/videos using the RSS feed from https://www.youtube.com/feeds/videos.xml?channel_id=UCoLrcjPV5PbUrUyXq5mjc_A for that channel

1. lambdaCondensedGame,js - Checks whether a condensed game stream is available for a given team on a given day
2. lambdaMonitor.js - Will see if a condensed game has been added, and if so sends a Slack message saying a new game is ready, plus a link to the stream

## Condensed Game function

This function reads from the POSTed JSON formatted like:

```
{
	gameDate: "2019-04-26",
	team: "New York Mets"
}
```

You must also send a HTTP header of ```MLBAPIRequest``` with a value set as an environment variable of the same name.

This will then:

1. Fetch the RSS feed for the YouTube RSS channel from https://www.youtube.com/feeds/videos.xml?channel_id=UCoLrcjPV5PbUrUyXq5mjc_A
2. Look for and entries that have the words [team name], "game" and "highlights" in them

Assuming that a game is found, the function then returns JSON like:
```
{
	"title": "Game Highlights: Mets vs Pittsburgh Pirates",
	"url": "https://www.youtube.com/v/9lcxYA7yJBE",
	"id": "9lcxYA7yJBE" 
}
```

### Configuration - Environment variables
- ```MLBAPIRequest```: The value to be sent in the header of any request

## Monitoring function

This function saves the last found game data in an S3 bucket, and then is designed to run on a schedule to do the following:

- Looks at the ID in saved game data JSON from the last successful run
- If the ID matches the last found highlights data, we're done
- Otherwise, call the condensed game function for either yesterday or today (if the last game was yesterday), and if the result has a url attribute
    - Save the latest game data JSON to S3
    - Call Slack sending the url attribute in a mesage

You can setup a schedule in Cloudwatch to run every N minutes.

### Configuration - Environment variables
- ```S3ACCESSKEYID```: Access Key for the S3 bucket to save game data
- ```S3DATABUCKET```: Name of the S3 bucket to save game data
- ```S3DATAFILE```: Name of the file to save game data in
- ```S3SECRETACCESSKEY```: Access Secret for the S3 bucket to save game data
- ```SLACK_WEBHOOK_URL```: URL of the webhook to send the Slack message to
- ```TEAM```: Team name to monitor e.g. "Mets"

