var dbConfig = require('./db');
var client = require('mongodb').MongoClient;
var connectionString = dbConfig.getConnectionString();
var collectionName = "items";
module.exports = {
    get: function (obj, limit, callback) {
        if (!obj) obj = {};
        if (!limit) limit = 10;
        client.connect(connectionString, function (err, db) {
            if (err) throw err;
            var collection = db.collection(collectionName);

            collection.find(obj).limit(limit).sort({ id: 1 }).toArray(function (err, docs) {
                if (err) throw err;
                callback(docs);
            });
        });
    },
    populate: function () {
        client.connect(connectionString, function (err, db) {
            if (err) throw err;
            var collection = db.collection(collectionName);

            collection.count(function (err, count) {

                for (var j = 0; j < 1000; j++) {
                    var id = j + 1;
                    var random = Math.floor((Math.random() * 10000) + 1);
                    var obj = {
                        id: id,
                        name: "Product " + id,
                        price: random,
                        description: "Product " + id + " description"
                    };

                    collection.insert(obj, function (err, obj) {
                        console.log("Inserted " + JSON.stringify(obj));
                    });
                }
            });
        });
    },
    save: function (name, description, price, callback) {
        client.connect(connectionString, function (err, db) {
            if (err) throw err;
            var collection = db.collection(collectionName);
            collection.count(function (err, count) {
                var id = count + 1;
                var obj = {
                    id: id,
                    name: name,
                    price: price,
                    description: description
                };

                collection.insert(obj, function (err, obj) {
                    if (err) throw err;
                    callback(err, obj);
                });
            });
        });
    }
};