var isLocal = true;
var connectionString = "";
var appConfig = require('../app.json');
module.exports = {
    getConnectionString: function () {
        if (connectionString != "") return connectionString;
        if (!appConfig) throw "App Config not found";
        var dbConfig = appConfig.db;
        if (!dbConfig) throw "Database config is unavailable";
        if (dbConfig.env == "local") isLocal = true; else isLocal = false;
        if (isLocal) {
            var host = dbConfig.local.host;
            var db = dbConfig.local.db;
            var port = dbConfig.local.port;
            connectionString = "mongodb://" + host + ":" + port + "/" + db;
        }
        else {
            var host = dbConfig.stage.host;
            var db = dbConfig.stage.db;
            var port = dbConfig.stage.port;
            var username = dbConfig.stage.username;
            var password = dbConfig.stage.password;

            connectionString = "mongodb://" + username + ":" + password + "@" + host + ":" + port + "/" + db;
        }
        console.log(connectionString);
        return connectionString;
    }
}