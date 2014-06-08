var _app;
var accountServices = require('./services/account');
var cartServices = require('./services/cart');
var orderServices = require('./services/order');
module.exports = {
    setRoutes: function (app) {
        _app = app;
        this._setUserRoutes();
        this._setAdminRoutes();
    },
    _setUserRoutes: function () {
        _app.get('/', function (req, res) {
            if (req.cookies.username) {
                res.render('index', {
                    username: req.cookies.username
                });
            }
            else {
                res.redirect('/login');
            }
        });
        _app.get('/logout', function (req, res) {
            res.clearCookie('username');
            res.clearCookie('userid');
            res.redirect('/login');
        });
        _app.get('/login', function (req, res) {
            var messages = [];
            var queryMessage = req.query.error;
            if (queryMessage) {
                queryMessage = queryMessage.toString();
                messages = queryMessage.split(",");
            }
            res.render('login', { error: messages });
        }).post('/login', function (req, res) {
            var username = req.body.username;
            var password = req.body.password;

            accountServices.get({ username: username, password: password }, function (err, docs) {
                if (err || (docs && docs.length == 0)) {
                    res.clearCookie('username');
                    res.clearCookie('user_id');
                    res.redirect('/login?error=Invalid Username/Password');
                }
                else {
                    var doc = docs[0];
                    res.cookie('username', doc.username, { maxAge: 60 * 60 * 1000 });
                    res.cookie('user_id', doc.id, { maxAge: 60 * 60 * 1000 });
                    res.redirect('/');
                }
            });
        });

        _app.get('/register', function (req, res) {
            var messages = [];
            var queryMessage = req.query.error;
            if (queryMessage) {
                queryMessage = queryMessage.toString();
                messages = queryMessage.split(",");
            }
            res.render('register', { error: messages });
        }).post('/register', function (req, res) {
            var username = req.body.username;
            var password = req.body.password;
            var email = req.body.email;

            accountServices.add(username, password, email, false).save(function (err, docs) {
                if (err) {
                    res.redirect('/register?error=' + err.message);
                }
                else {
                    res.redirect('/login');
                }
            });
        });


        _app.get('/cart', function (req, res) {
            if (req.cookies.username) {
                var userId = parseInt(req.cookies.user_id);
                cartServices.get(userId, function (err, data) {
                    if (err) throw err;
                    res.render('cart', {
                        username: req.cookies.username,
                        cartList: data
                    });
                });
            }
            else {
                res.redirect('/login');
            }
        });

        _app.get('/orders', function (req, res) {
            if (req.cookies.username) {
                var userId = parseInt(req.cookies.user_id);
                orderServices.get({ user_id: userId }, function (err, docs) {
                    if (err) throw err;
                    res.render('order', {
                        username: req.cookies.username,
                        orderList: docs
                    });
                });
            }
            else {
                res.redirect('/login');
            }
        });
    },
    _setAdminRoutes: function () {
        _app.get('/admin', function (req, res) {
            if (req.cookies.admin_username) {
                var queryMessage = req.query.q;
                var type = "";
                var obj = {};
                if (queryMessage) {
                    queryMessage = queryMessage.toString();
                    messages = queryMessage.split(",");
                    if (messages.length > 0) {
                        type = messages[0];
                    }
                }
                if (type != "") {
                    obj.status = new RegExp(type, "i");
                }
                orderServices.get(obj, function (err, docs) {
                    res.render('admin/index', {
                        admin_username: req.cookies.admin_username,
                        type: type,
                        orderList: docs
                    });
                });

            }
            else {
                res.redirect('/admin/login');
            }
        });
        _app.get('/admin/logout', function (req, res) {
            res.clearCookie('admin_username');
            res.clearCookie('admin_user_id');
            res.redirect('/admin/login');
        });
        _app.get('/admin/login', function (req, res) {
            var messages = [];
            var queryMessage = req.query.error;
            if (queryMessage) {
                queryMessage = queryMessage.toString();
                messages = queryMessage.split(",");
            }
            res.render('admin/login', { error: messages });
        }).post('/admin/login', function (req, res) {
            var username = req.body.username;
            var password = req.body.password;

            accountServices.get({ username: username, password: password, is_admin: true }, function (err, docs) {
                if (err || (docs && docs.length == 0)) {
                    res.clearCookie('admin_username');
                    res.clearCookie('admin_user_id');
                    res.redirect('/admin/login?error=Invalid Username/Password');
                }
                else {
                    var doc = docs[0];
                    res.cookie('admin_username', doc.username, { maxAge: 60 * 60 * 1000 });
                    res.cookie('admin_user_id', doc.id, { maxAge: 60 * 60 * 1000 });
                    res.redirect('/admin');
                }
            });
        });
    }
};