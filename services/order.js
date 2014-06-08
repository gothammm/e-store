var dbConfig = require('./db');
var client = require('mongodb').MongoClient;
var connectionString = dbConfig.getConnectionString();
var collectionName = "orders";

module.exports = {
    add: function (productid, userid, order_count, callback) {
        client.connect(connectionString, function (err, db) {
            if (err) throw err;
            var collection = db.collection(collectionName);

            collection.count(function (err, count) {
                if (err) throw err;
                var obj = {
                    id: count + 1,
                    product_id: productid,
                    user_id: userid,
                    order_count: order_count,
                    order_date: new Date(),
                    status: "Shipping"
                };

                collection.insert(obj, function (err, docs) {
                    if (err) throw err;
                    callback(err, docs);
                });
            });
        });
    },
    get: function (options, callback) {
        if (!options) options = {};
        client.connect(connectionString, function (err, db) {
            if (err) throw err;
            var orderColl = db.collection(collectionName);
            var itemsColl = db.collection("items");
            orderColl.find(options).sort({ order_date: -1 }).toArray(function (err, docs) {
                if (err) throw err;
                if (docs.length > 0) {
                    var i = 0;
                    var cb = function () {
                        if (i == docs.length) {
                            callback(err, docs);
                            return false;
                        }
                        var doc = docs[i];
                        var productId = doc.product_id;
                        itemsColl.findOne({ id: productId }, function (err, item) {
                            if (err) throw err;
                            if (item) {
                                doc.price = item.price;
                                doc.name = item.name;
                                doc.description = item.description;
                                i++;
                                cb();
                            }
                        });
                    };
                    cb();
                }
                else {
                    callback(err, docs);
                }
            });
        });
    },
    updatestatus: function (status, orderid, callback) {
        client.connect(connectionString, function (err, db) {
            if (err) throw err;
            var collection = db.collection(collectionName);
            collection.update({ id: orderid }, { $set: { status: status } }, function (err, doc) {
                if (err) throw err;
                callback(err, doc);
            });
        });
    }
};