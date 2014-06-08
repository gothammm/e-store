var _app;
var itemServices = require('./services/items');
var cartServices = require('./services/cart');
var accountServices = require('./services/account');
var orderServices = require('./services/order');

module.exports = {
    setRoutes: function (app) {
        _app = app;
        this._setItemRoutes();
        this._setCartRoutes();
        this._setOrderRoutes();
    },
    _setItemRoutes: function () {
        _app.get('/api/items/get', function (req, res) {
            var id = req.query.id;
            var limit = req.query.limit;
            var startat = req.query.startat;
            var search = req.query.q;
            var obj = {};
            if (limit != undefined) limit = parseInt(limit); else limit = 10;
            if (id != undefined) id = parseInt(id) == NaN ? "" : parseInt(id);
            if (id) obj.id = id;

            if (startat != undefined) startat = parseInt(startat) == NaN ? "" : parseInt(startat);
            if (startat) {
                obj = {};
                obj = {
                    id: {
                        $gt: startat
                    }
                }
            }
            if (search) {
                obj = {};
                obj = {
                    $or: [{
                        name: new RegExp(search, "i")
                    }, {
                        description: new RegExp(search, "i")
                    }]
                }
                if (startat) {
                    var newobj = obj;
                    obj = {
                        $and: [{
                            id: {
                                $gt: startat
                            }
                        }]
                    };
                    obj.$and.push(newobj);
                }
            }

            itemServices.get(obj, limit, function (docs) {
                var userId = parseInt(req.cookies.user_id);
                if (userId != NaN) {
                    accountServices.get({ id: userId }, function (err, data) {
                        if (data && data.length > 0) {
                            var user = data[0];
                            var cartData = user.cart;
                            if (cartData && cartData.length > 0) {
                                for (var i = 0; i < docs.length; i++) {
                                    var item = docs[i];
                                    var productId = item.id;
                                    for (var j = 0; j < cartData.length; j++) {
                                        var cartInfo = cartData[j];
                                        if (productId == cartInfo.product_id) {
                                            delete docs[i];
                                        }
                                    }
                                }
                            }
                        }
                        var newList = [];
                        for (var i = 0; i < docs.length; i++) {
                            if (docs[i]) newList.push(docs[i]);
                        }
                        res.json(newList);
                    });

                }
                else {
                    res.json(docs);
                }
            });
        });

        _app.get('/api/items/populate', function (req, res) {
            itemServices.populate();
            res.send("Populating data...");
        });

        _app.post('/api/items/save', function (req, res) {
            var name = req.body.product_name;
            var price = parseInt(req.body.product_price);
            var description = req.body.product_description;

            itemServices.save(name, description, price, function (err, docs) {
                res.json(docs);
            });
        });

    },
    _setCartRoutes: function () {
        _app.post('/api/cart/add', function (req, res) {
            var userId = req.cookies.user_id;

            userId = parseInt(userId);
            var productId = req.body.product_id;
            var productCount = req.body.product_count;
            productId = parseInt(productId);
            productCount = parseInt(productCount);
            cartServices.add(productId, productCount, userId, function (err, result) {
                if (err) res.json(err);
                if (result) res.json(result);
            });
        });

        _app.get('/api/cart/get', function (req, res) {
            var userId = req.cookies.user_id;

            userId = parseInt(userId);
            cartServices.get(userId, function (err, docs) {
                res.json(docs);
            });
        });
    },
    _setOrderRoutes: function () {
        var me = this;
        _app.post('/api/order/submit', function (req, res) {
            var userId = req.cookies.user_id;

            userId = parseInt(userId);
            var cart = JSON.parse(req.body.cart);
            if (cart && cart.length > 0) {
                var i = 0;
                var cb = function (err, docs) {
                    var newCb = this;
                    i++;
                    if (i == cart.length) {
                        cartServices.empty(userId, function (err, docs) {
                            res.json(true);
                        });
                    }
                    else {
                        orderServices.add(cart[i].id, userId, cart[i].count, cb);
                    }
                };
                orderServices.add(cart[i].id, userId, cart[i].count, function (err, docs) {
                    cb(err, docs);
                });
            }
        });

        _app.get('/api/order/get', function (req, res) {
            var userId = req.cookies.user_id;

            userId = parseInt(userId);
            orderServices.get({ user_id: userId }, function (err, docs) {
                if (err) throw err;
                res.json(docs);
            });
        });

        _app.post('/api/order/updatestatus', function (req, res) {
            var userId = req.cookies.admin_user_id;
            var orderId = parseInt(req.body.orderid);
            var status = req.body.status;
            if (userId && !isNaN(orderId) && status) {
                orderServices.updatestatus(status, orderId, function (err, docs) {
                    res.json(true);
                });
            }
            else {
                res.json(false);
            }
        });
    }
};