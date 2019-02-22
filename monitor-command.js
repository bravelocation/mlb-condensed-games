const mlbMonitor = require("./mlb-monitor");
require('dotenv').config();

mlbMonitor.checkForChanges(function(err, result) {
    if (err) {
        console.log("Error: " + err);
    } else {
        console.log(result);
    }
});