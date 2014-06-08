var dbConfig = require('./db');
var client = require('mongodb').MongoClient;
var connectionString = dbConfig.getConnectionString();
var accounts  = [], accountsInsertCount = 0;
module.exports = {
    add: function (username, password, email, isAdmin) {
        if (!isAdmin) isAdmin = false;
        if (typeof isAdmin != 'boolean') isAdmin = false;

        var obj = {
            username: username,
            email: email,
            password: password,
            is_admin: isAdmin
        };

        accounts.push(obj);
        return this;
    },
    save: function (callback) {
        var me = this;
        if (accounts.length > 0) {
            me._checkIfDuplicate(accounts[accountsInsertCount].username, accounts[accountsInsertCount].email, function (isExist) {
                if (isExist) {
                    callback(new Error("Username/Email already exists"), null);
                    accountsInsertCount = 0;
                    accounts = [];
                    return;
                }
                else {
                    me._insert(accounts[accountsInsertCount], callback);
                }
                accountsInsertCount++;
                if (accountsInsertCount == accounts.length) {
                    accountsInsertCount = 0;
                    accounts = [];
                    return;
                }
                me.save(callback);
            });
        }
        else {
            callback(new Error("No records to be inserted"), null);
        }
    },
    get: function (obj, callback) {
        client.connect(connectionString, function (err, db) {
            if (err) throw err;
            var collection = db.collection('accounts');
            collection.find(obj).toArray(function (err, docs) {
                callback(err, docs);
            });
        });
    },
    _insert: function (obj, callback) {
        client.connect(connectionString, function (err, db) {
            if (err) throw err;
            var collection = db.collection('accounts');
            collection.count(function (err, count) {
                if (err) throw err;
                var id = count + 1;
                obj.id = id;
                collection.insert(obj, function (err, docs) {
                    callback(err, docs);
                });
            });
        });
    },
    _checkIfDuplicate: function (username, email, callback) {
        client.connect(connectionString, function (err, db) {
            if (err) throw err;
            var collection = db.collection('accounts');
            var queryObj = { $or: [] };
            if (username) queryObj.$or.push({ "username": username });
            if (email) queryObj.$or.push({ "email": email });

            collection.find(queryObj).count(function (err, count) {
                if (err) throw err;
                if (count > 0) callback(true); else callback(false);
            });
        });
    }
}