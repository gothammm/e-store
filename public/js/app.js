(function () {
    var global = this;
    global.store = {};

    store = {
        register: {
            setup: function () {
                var registerForm = $("#register-form");
                registerForm.submit(function (e) {
                    var username = registerForm.find("#username").val();
                    var password = registerForm.find("#password").val();
                    var email = registerForm.find("#email").val();

                    if (!username) { alert("Please enter username"); return false; }
                    if (!password) { alert("Please enter passsword"); return false; }
                    if (!email) { alert("Please enter email"); return false; }

                    return true;
                });
            }
        },
        main: {
            lastProductId: null,
            isBySearch: false,
            services: {
                getItemListing: function (obj, cb) {
                    var me = this;
                    if (!obj) obj = {};
                    $.ajax({
                        cache: false,
                        url: "/api/items/get",
                        method: "GET",
                        data: obj,
                        success: function (data) {
                            var items = data;
                            $("#item-loading-spinner").hide("slow");
                            if (items && items.length > 0) {
                                $("#no-more-listing").hide();
                                for (var i = 0; i < items.length; i++) {
                                    $("#items-listing").append(store.main._template(items[i])).fadeIn('slow');
                                }
                                store.main.lastProductId = items[items.length - 1].id;
                                $("#item-main-listing").show("slow");
                                $("#load-more-btn").show("slow");
                            }
                            else {
                                $("#load-more-btn").find("img").hide("slow");
                                $("#load-more-btn").find("button").prop("disabled", true);
                                $("#no-more-listing").show();
                                return false;
                            }
                            store.main._attachAddCartEvent();

                            if (cb) cb();
                        },
                        error: function (err) {

                        }
                    });
                },
                addToCart: function (id, cb, pc) {
                    if (!pc) pc = 1;
                    if (id) {
                        $.ajax({
                            cache: false,
                            url: "/api/cart/add",
                            method: "POST",
                            data: { product_id: id, product_count: pc },
                            success: function (data) {
                                cb(true);
                            },
                            error: function (data) {
                                cb(data);
                            }
                        });
                    }
                    else {
                        cb(false);
                    }
                },
                getCart: function (cb) {
                    $.ajax({
                        cache: false,
                        method: "GET",
                        url: "/api/cart/get",
                        success: function (data) {
                            cb(data);
                        },
                        error: function () {
                            cb([]);
                        }
                    });
                }
            },
            _template: function (data) {
                if (!data) return "";
                var template = '<div class="panel-body" id="item-' + data.id + '">\
                               <div class="panel panel-success">\
                                    <div class="panel-body">\
                                        <div class="pull-left"><img alt="items" src="/images/cart.png" style="width:60px; height:100px;"/></div>\
                                        <div class="pull-left" style="margin-left: 20px;">\
                                            <div><b>Name:</b> ' + data.name + '</div>\
                                            <div><b>Price:</b>' + data.price + '</div>\
                                            <div><b>Description:</b><p>' + data.description + '</p></div>\
                                        </div>\
                                        <div class="pull-right"><button class="btn btn-success" data-itemid="' + data.id + '" id="item-add-cart-' + data.id + '">Add to cart</button></div>\
                                    </div>\
                           </div></div>';
                return template;
            },
            _attachAddCartEvent: function () {
                $("button[id*='item-add-cart']").unbind("click");
                $("button[id*='item-add-cart']").click(function () {
                    var me = this;
                    var itemId = $(me).data("itemid");
                    $(me).text("Adding to cart").attr("disabled", true);
                    store.main.services.addToCart(itemId, function (isAdded) {
                        var cartBadge = $("#cart-count").text();
                        cartBadge = parseInt(cartBadge) + 1;
                        $("#cart-count").text(cartBadge);
                        $(me).text("Added to cart").attr("disabled", true);
                    });
                    console.log(itemId);
                });
            },
            setup: function () {
                var me = this;
                $(document).ready(function () {
                    me.services.getItemListing();
                    $("#load-more-btn").click(function () {
                        $("#load-more-btn").find("img").show("slow");
                        $("#load-more-btn").find("button").attr("disabled", true);

                        var obj = {};
                        if (store.main.lastProductId) {
                            obj.startat = store.main.lastProductId;
                        }
                        var searchFieldValue = $("#main-search-item").find("input[type='search']").val();
                        if (searchFieldValue) {
                            obj.q = searchFieldValue;
                        }

                        if (obj) {
                            store.main.services.getItemListing(obj, function () {
                                $("#load-more-btn").find("img").hide("slow");
                                $("#load-more-btn").find("button").attr("disabled", false);
                            });
                        }
                    });
                    $("#main-search-item").submit(function () {
                        $("#item-loading-spinner").show("slow");
                        var query = $(this).find("input[type='search']").val();
                        if (query) {
                            $("#items-listing").find("div[id*='item']").remove();
                            store.main.services.getItemListing({ q: query });
                        }
                        else {
                            window.location.reload();
                            $("#item-loading-spinner").hide("slow");
                        }
                        return false;
                    });
                    store.main.services.getCart(function (data) {
                        var count = data.length ? data.length : 0;
                        $("#cart-count").text(count);
                    });
                });
            }
        },
        cart: {
            isCartSaved: true,
            setup: function () {
                $(document).ready(function () {
                    $("button[id*='add-']").unbind("click");
                    $("button[id*='minus-']").unbind("click");
                    $("button[id*='minus-']").click(function () {
                        store.cart.isCartSaved = false;
                        var me = $(this).closest("tr");
                        var itemPrice = parseInt($(me).find(".item-price").text());
                        var itemId = parseInt($(me).data("productid"));
                        var itemCount = parseInt($(me).find(".inner-item-count").text());
                        if (itemCount > 1) {
                            itemCount -= 1;
                            $(me).find(".inner-item-count").text(itemCount);
                            var totalPrice = itemPrice * itemCount;
                            $(me).find(".total-price").text(totalPrice);
                            $("#my-cart-summary-list").find("button").attr("disabled", true);
                            store.main.services.addToCart(itemId, function (data) {
                                $("#my-cart-summary-list").find("button").attr("disabled", false);
                            }, -1);
                        }
                    });
                    $("button[id*='add-']").click(function () {
                        store.cart.isCartSaved = false;
                        var me = $(this).closest("tr");
                        var itemId = parseInt($(me).data("productid"));
                        var itemPrice = parseInt($(me).find(".item-price").text());
                        var itemCount = parseInt($(me).find(".inner-item-count").text());
                        itemCount += 1;
                        $(me).find(".inner-item-count").text(itemCount);
                        var totalPrice = itemPrice * itemCount;
                        $(me).find(".total-price").text(totalPrice);
                        $("#my-cart-summary-list").find("button").attr("disabled", true);
                        store.main.services.addToCart(itemId, function (data) {
                            $("#my-cart-summary-list").find("button").attr("disabled", false);
                        }, 1);
                    });
                    $("#btn-cart-order").click(function () {
                        $(this).attr("disabled", true);
                        store.cart.services.submitOrder(function (data) {
                            $(this).attr("disabled", false);
                            alert("Order complete!");
                            window.location.reload();
                        });
                    });
                });
            },
            services: {
                submitOrder: function (cb) {
                    var cartTb = $("#my-cart-summary-list");
                    var products = cartTb.find("tr[id*='cart-item']");
                    var cartSummary = [];
                    if (products.length > 0) {
                        for (var i = 0; i < products.length; i++) {
                            var product = $(products[i]);
                            var productId = product.data("productid");
                            var count = parseInt(product.find(".inner-item-count").text());
                            cartSummary.push({ id: productId, count: count });
                        }
                    }
                    $.ajax({
                        url: "/api/order/submit",
                        data: { cart: JSON.stringify(cartSummary) },
                        cache: false,
                        method: "POST",
                        success: function (data) {
                            cb(data);
                        },
                        error: function () {
                            cb(null);
                        }
                    });
                }
            }
        },
        admin: {
            setup: function () {
                var adminList = $("#admin-order-summary-list");
                adminList.find("button[id*='ship-btn']").click(function () {
                    var me = this;
                    var tr = $(this).closest("tr");
                    var orderId = $(tr).data("orderid");
                    var status = "Shipped";
                    $(me).text("Changing status!").attr("disabled", true);
                    $.ajax({
                        url: "/api/order/updatestatus",
                        method: "POST",
                        data: { orderid: orderId, status: status },
                        cache: false,
                        success: function (data) {
                            $(me).text("Shipped!");
                            $(me).attr("disabled", true);
                        },
                        error: function (data) {

                        }
                    });
                });
                adminList.find("button[id*='deliver-btn']").click(function () {
                    var me = this;
                    var tr = $(this).closest("tr");
                    var orderId = $(tr).data("orderid");
                    var status = "Delivered";
                    $(me).text("Changing status!").attr("disabled", true);
                    $.ajax({
                        url: "/api/order/updatestatus",
                        method: "POST",
                        data: { orderid: orderId, status: status },
                        cache: false,
                        success: function (data) {
                            $(me).text("Delivered!");
                            $(me).attr("disabled", true);
                        },
                        error: function (data) {

                        }
                    });
                });
                $("#save-product-btn").click(function () {
                    var me = this;
                    $(this).attr("disabled", true);
                    var productName = $("#product_name").val();
                    var productDescription = $("#product_description").val();
                    var productPrice = $("#product_price").val();
                    productPrice = parseInt(productPrice);
                    if (!productName) {
                        alert("Please enter product name");
                        return false;
                    }
                    if (!productDescription) {
                        alert("Please enter product description");
                        return false;
                    }
                    if (!productPrice || isNaN(productPrice)) {
                        alert("Please enter valid product price");
                        return false;
                    }
                    $.ajax({
                        url: "/api/items/save",
                        method: "POST",
                        data: { product_name: productName, product_price: productPrice, product_description: productDescription },
                        cache: false,
                        success: function () {
                            $(me).attr("disabled", false);
                            alert("Product saved!");
                            $('#admin-add-product').modal('hide');
                        },
                        error: function () {
                            alert("Unknown error has occured, try again");
                        }
                    });
                });
            }
        }
    };
    if (document.URL) {
        if (document.URL.indexOf("register") > -1) {
            store.register.setup();
        }

        if (document.URL.indexOf("/") > -1) {
            store.main.setup();
        }
        if (document.URL.indexOf("cart") > -1) {
            store.cart.setup();
        }
        if (document.URL.indexOf("admin") > -1) {
            store.admin.setup();
        }
    }
    else {
        store.main.setup();
    }
})();
