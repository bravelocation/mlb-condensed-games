# MLB Condensed Games

A few functions to look for MLB Condensed Games from their YouTube channel at https://www.youtube.com/@MLB/videos using the RSS feed from https://www.youtube.com/feeds/videos.xml?channel_id=UCoLrcjPV5PbUrUyXq5mjc_A for that channel

1. lambdaCondensedGame.js - Checks whether a matching MLB highlights video is available for a given team
2. lambdaMonitor.js - Checks for newly posted matching highlights and sends a Slack message with the link

## Condensed Game function

This function reads from the POSTed JSON formatted like:

```
{
	"params": {
		"team": "New York Mets"
	}
}
```

You must also send a HTTP header of ```MLBAPIRequest``` with a value set as an environment variable of the same name.

This will then:

1. Fetch the RSS feed for the YouTube RSS channel from https://www.youtube.com/feeds/videos.xml?channel_id=UCoLrcjPV5PbUrUyXq5mjc_A
2. Find the first entry containing the provided team name, `mlb`, and `game highlights`

Assuming that a game is found, the function then returns JSON like:
```
{
	"title": "Game Highlights: Mets vs Pittsburgh Pirates",
	"url": "https://www.youtube.com/v/9lcxYA7yJBE",
	"id": "9lcxYA7yJBE" 
}
```

If no matching game is found, the function returns an empty JSON object.

### Configuration - Environment variables
- ```MLBAPIRequest```: The value to be sent in the header of any request

## Monitoring function

This function saves the last found game data in an S3 bucket, and then is designed to run on a schedule to do the following:

- Looks at the ID in saved game data JSON from the last successful run
- If the ID matches the last found highlights data, we're done
- Otherwise, call the condensed game function and if the result has a `title`, `id`, and `url`:
	- Save the latest game data JSON to S3
	- Send a Slack message containing the title and URL

You can set up a schedule in CloudWatch to run every N minutes.

### Configuration - Environment variables
- ```S3ACCESSKEYID```: Access Key for the S3 bucket to save game data
- ```S3DATABUCKET```: Name of the S3 bucket to save game data
- ```S3DATAFILE```: Name of the file to save game data in
- ```S3SECRETACCESSKEY```: Access Secret for the S3 bucket to save game data
- ```SLACK_WEBHOOK_URL```: URL of the webhook to send the Slack message to
- ```TEAM```: Team name to monitor e.g. "Mets"

