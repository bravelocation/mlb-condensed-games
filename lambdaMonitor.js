const mlbMonitor = require("./mlb-monitor");

exports.handler = function(event, context, callback) {
    mlbMonitor.checkForChanges(callback);
};
