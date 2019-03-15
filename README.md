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
	team: "nym"
}
```

You must also send a HTTP header of ```MLBAPIRequest``` with a value set as an environment variable of the same name.

This will then:

1. Build URL like http://gd2.mlb.com/components/game/mlb/year_2018/month_06/day_26/master_scoreboard.xml (using the incoming date)
2. Look for &lt;game&gt; node where home_file_code="nym" or away_file_code="nym” (using the incoming team)
3. Pick up game_pk attribute to get the URL e.g. "https://statsapi.mlb.com/api/v1/game/530594/content?language=en" 
4. Find in the media.epgAlternate nodes the "Extended Highlights" section, and then find the item that is the condensed game (if it exists)
5. Pick the correct URL node - the largest sized video that has a value that ends in .mp4

Assuming that a condensed game is found, the function then returns JSON like:
```
{
	opponent: "pit",
	date: "2019-04-26",
	url: "http://mediadownloads.mlb.com/mlbam/mp4/2018/06/27/2202032583/1530076464641/asset_1200K.mp4"
}
```

Note:
- The ```opponent``` attribute can null if no game has been found
- The ```url``` attribute can null if no condensed game stream has been found for the game


### Configuration - Environment variables
- ```MLBAPIRequest```: The value to be sent in the header of any request


## Monitoring function

This function saves the last found game data in an S3 bucket, and then is designed to run on a schedule to do the following:

- Looks at date in saved game data JSON from the last successful run
- If date is today, we're done (we don't cope with double-headers yet!)
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
- ```TEAM```: Team abbreviation to monitor e.g. nym

