# MLB Condensed Games

A few functions to look for MLB Condensed Games from their open API. These were inspired by the excellent [Baseball Theater](https://github.com/jakelauer/BaseballTheater)

There are 2 main entry points - designed to be run from AWS Lambda:

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

1. Build URL likehttps://statsapi.mlb.com/api/v1/schedule?sportId=1,51&date=2023-03-04 (using the incoming date)
2. Look for &lt;game&gt; node where teams.away.name or teams.home.name="New York Mets” (using the incoming team)
3. Pick up gamePK attribute to get the URL e.g. "https://statsapi.mlb.com/api/v1/game/530594/content?language=en" 
4. Find in the media.epgAlternate nodes the "Extended Highlights" section, and then find the item that is the condensed game video (if it exists)
5. Pick the correct URL node - the video that has a value that ends in .mp4

Assuming that a condensed game is found, the function then returns JSON like:
```
{
	"opponent": "Pittsburgh Pirates",
	"date": "2019-04-26",
	"url": "http://mediadownloads.mlb.com/mlbam/mp4/2018/06/27/2202032583/1530076464641/asset_1200K.mp4",
	"mediaType": "Extended Highlights" 
}
```

Note:
- The ```opponent``` attribute can null if no game has been found
- The ```url``` attribute can null if no condensed game stream has been found for the game
- The ```mediaType``` attribute can null or "Extended Highlights" (I experimented with also getting the "Recap" for a while)


### Configuration - Environment variables
- ```MLBAPIRequest```: The value to be sent in the header of any request


## Monitoring function

This function saves the last found game data in an S3 bucket, and then is designed to run on a schedule to do the following:

- Looks at date in saved game data JSON from the last successful run
- If date is today, we're done (we don't cope with double-headers yet!)
- Otherwise, call the condensed game function for either yesterday or today (if the last game was yesterday), and if the result has a url attribute
    - Save the latest game data JSON to S3
    - Call Slack sending the url attribute in a mesage
    - Call an IFTTT web hook that sends an iOS notification, clicking on which opens the viedo URL

You can setup a schedule in Cloudwatch to run every N minutes.

### Configuration - Environment variables
- ```S3ACCESSKEYID```: Access Key for the S3 bucket to save game data
- ```S3DATABUCKET```: Name of the S3 bucket to save game data
- ```S3DATAFILE```: Name of the file to save game data in
- ```S3SECRETACCESSKEY```: Access Secret for the S3 bucket to save game data
- ```SLACK_WEBHOOK_URL```: URL of the webhook to send the Slack message to
- ```TEAM```: Team abbreviation to monitor e.g. nym
- ```IFTTT_EVENT_NAME```: Name of the IFTTT event to send the notification call to
- ```IFTTT_MAKER_KEY```: Name of the IFTTT maker key to enable IFTTT calls

