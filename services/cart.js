var dbConfig = require('./db');
var client = require('mongodb').MongoClient;
var connectionString = dbConfig.getConnectionString();
var collectionName = "accounts";

module.exports = {
    add: function (productId, productCount, userId, callback) {
        var isPush = true;
        client.connect(connectionString, function (err, db) {
            if (err) throw err;
            var collection = db.collection(collectionName);

            collection.findOne({ id: userId }, function (err, doc) {
                if (err) throw err;
                if (doc && doc.cart) {
                    var cartData = doc.cart;
                    for (var i = 0; i < cartData.length; i++) {
                        var data = cartData[i];
                        if (data.product_id == productId) {
                            isPush = false;
                            data.count += productCount;
                        }
                    }
                    if (isPush) {
                        cartData.push({
                            product_id: productId,
                            count: productCount
                        });
                    }
                    collection.update({ id: userId }, { $set: { cart: cartData} }, function (err, result) {
                        if (err) throw err;
                        callback(result);
                    });
                }
                else {
                    var cart = [{
                        product_id: productId,
                        count: productCount
                    }];
                    collection.update({ id: userId }, { $set: { cart: cart} }, function (err, result) {
                        if (err) throw err;
                        callback(result);
                    });
                }
            });

        });
    },
    get: function (userId, callback) {
        client.connect(connectionString, function (err, db) {
            if (err) throw err;
            var collection = db.collection(collectionName);
            collection.findOne({ id: userId }, function (err, doc) {
                var cart = [];
                if (doc && doc.cart) {
                    cart = doc.cart;
                }
                var productIds = [];
                for (var i = 0; i < cart.length; i++) {
                    productIds.push(cart[i].product_id);
                }
                db.collection("items").find({ id: { $in: productIds} }).sort({ id: 1 }).toArray(function (err, docs) {
                    if (err) throw err;
                    if (docs) {
                        for (var i = 0; i < docs.length; i++) {
                            var doc = docs[i];
                            for (var j = 0; j < cart.length; j++) {
                                if (cart[j].product_id == doc.id) {
                                    doc["count"] = cart[j].count;
                                    cart.splice(j, 1);
                                    j = j - 1;
                                }
                            }
                        }
                        callback(err, docs);
                    }
                });
            });
        });
    },
    empty: function (userId, callback) {
        client.connect(connectionString, function (err, db) {
            if (err) throw err;
            var collection = db.collection(collectionName);
            collection.update({ id: userId }, { $set: { cart: []} }, function (err, result) {
                if (err) throw err;
                callback(err, result);
            });
        });
    }
};