// server.js
// where your node app starts
const express = require("express");
const app = express();
const cors = require('cors')
const bodyParser = require("body-parser");
app.use(bodyParser.raw({ type: "*/*" }));
app.use(cors())
///////////////

let passwords = new Map();
let users = new Map();
let items = new Map();
let carts = new Map();
let purchases = new Map();
let chats = new Map();
let shippedItems = new Map();
let reviews = new Map();

//////////////

app.post("/signup", (req, res) => {
  let parsed = JSON.parse(req.body);
  let username = parsed.username;
  let password = parsed.password;
  console.log("password", password);
  
  //Error messages
  if (passwords.has(username)) {
    res.send(JSON.stringify({ success: false, reason: "Username exists" }));
    return;
  }
  if (username === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
    return;
  } else if (password === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
    return;
  }
  
  // Success
  passwords.set(username, password);
  res.send(JSON.stringify({ success: true }));
});

app.post("/login", (req, res) => {
  let parsed = JSON.parse(req.body)
  let username = parsed.username
  let actualPassword = parsed.password
  let expectedPassword = passwords.get(username)
  ///////////
  let genToken = Math.random().toString(36).substr(2, 5);
  
  // Error messages
  if (username === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
    return
  } else if (actualPassword === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
    return
  }
  
  if (expectedPassword === undefined) {
      res.send(JSON.stringify({ success: false, reason: "User does not exist" }))
      return
  }
  if (expectedPassword !== actualPassword) {
      res.send(JSON.stringify({ success: false, reason: "Invalid password" }))
      return
  }
  
  // Success
  users.set(genToken, username);
  passwords.set(genToken, expectedPassword)
  res.send(JSON.stringify({ success: true,"token": genToken }))
});

app.post("/change-password", (req, res) => {
  let parsed = JSON.parse(req.body);
  let token = req.headers.token;
  let oldPassword = parsed.oldPassword;
  let newPassword = parsed.newPassword;
  
  // Error messages
  if (token === undefined) {
      res.send(JSON.stringify({ success: false, "reason":"token field missing" }))
      return
  }
  
  if (!users.has(token)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
  }
  
  let rightPass = passwords.get(token)
  
  if (oldPassword !== rightPass) {
    res.send(JSON.stringify({ success: false, reason: "Unable to authenticate" }));
    return;
  }
  
  let username = users.get(token)
  
  // Success
  passwords.set(token, newPassword)
  passwords.set(username, newPassword);
  console.log(passwords)
  res.send(JSON.stringify({ success: true }));
});

app.post("/create-listing", (req, res) => {
  let parsed = JSON.parse(req.body);
  let token = req.headers.token;
  let price = parsed.price;
  let description = parsed.description;
  ////
  let genItemId = Math.random().toString(36).substr(2, 5);
  
  // Error messages
  if (token === undefined) {
      res.send(JSON.stringify({ success: false, "reason":"token field missing" }))
      return
  }
  
  if (!users.has(token)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
  }
  
  if (price === undefined) {
    res.send(JSON.stringify({ success: false, reason: "price field missing" }));
    return;
  }
  
  if (description === undefined) {
    res.send(JSON.stringify({ success: false, reason: "description field missing" }));
    return;
  }
  
  let username = users.get(token)
  
  let itemInfo = {
    price: price, 
    description: description,
    user: username,
    itemSold: false
  }
  
  // Success
  items.set(genItemId, itemInfo)
  res.send(JSON.stringify({ success: true, listingId: genItemId }));
});

app.get("/listing", (req, res) => {
  let listingId = req.query.listingId
  
  //Error messages
  if (!items.has(listingId)) {
      res.send(JSON.stringify({ success: false, "reason":"Invalid listing id" }))
      return
  }
  
  // Success
  let price = items.get(listingId)["price"]
  let description = items.get(listingId)["description"]
  let sellerUsername = items.get(listingId)["user"]
  
  res.send(JSON.stringify({ success: true, listing: {price, description, itemId: listingId, sellerUsername} }));
});

app.post("/modify-listing", (req, res) => {
  let parsed = JSON.parse(req.body);
  let token = req.headers.token;
  let itemId = parsed.itemid;
  let price = parsed.price;
  let description = parsed.description;
  
  // Error messages
  if (token === undefined) {
      res.send(JSON.stringify({ success: false, "reason":"token field missing" }))
      return
  }
  
  if (!users.has(token)) {
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
      return
  }
  
  if (itemId === undefined) {
      res.send(JSON.stringify({ success: false, reason: "itemid field missing" }))
      return
  }
  
  if (price === undefined && description === undefined) {
    return
  }
  
  // Success
  let username = users.get(token)
  
  let itemInfo
  
  if (description === undefined) {
      itemInfo = {
        price: price, 
        description: items.get(itemId)["description"],
        user: username
      }
  } else if (price === undefined) {
       itemInfo = {
        price: items.get(itemId)["price"], 
        description: description,
        user: username
      }
  } else {
     itemInfo = {
      price: price, 
      description: description,
      user: username
    }
  }
  
  items.set(itemId, itemInfo)
  
  res.send(JSON.stringify({ success: true }));
});

app.post("/add-to-cart", (req, res) => {
  let parsed = JSON.parse(req.body);
  let token = req.headers.token;
  let itemId = parsed.itemid;
  
  // Error messages
  if (!users.has(token)) {
      res.send(JSON.stringify({ success: false, "reason":"Invalid token" }))
      return
  }
  
  if (itemId === undefined) {
      res.send(JSON.stringify({ success: false, "reason":"itemid field missing" }))
      return
  }
  
  if (!items.has(itemId)) {
      res.send(JSON.stringify({ success: false, "reason":"Item not found" }))
      return
  }
  
  // Success
  let username = users.get(token)
  
  // Check if there is already a cart else set one
  if (carts.has(username)){
      //////////////////////
      carts.get(username)["usrCartItems"].push(itemId);
  } else {
      // Set an array in the Map to add multiple items to same buyer
      let cart = { usrCartItems: [itemId] }
      carts.set(username, cart);
  }

  res.send(JSON.stringify({ success: true }));
});

app.get("/cart", (req, res) => {
  let token = req.headers.token;
  
  // Error messages
  if (!users.has(token)) {
      res.send(JSON.stringify({ success: false, "reason":"Invalid token" }))
      return
  }
  
  let cartArr = [];
  let username = users.get(token);
  let usrCartItems = carts.get(username)["usrCartItems"]

  for (let i = 0; i < usrCartItems.length; i++) {
    
    let item = items.get(usrCartItems[i]);

    let itemInfo = {
        price: item["price"],
        description: item["description"],
        itemId: usrCartItems[i],
        sellerUsername: item["user"]
    }

    // Push all information about the product in array to then send it (res.send)
    cartArr.push(itemInfo);
  }
  
  // Success
  res.send(JSON.stringify({ success: true, cart: cartArr }));
});

app.post("/checkout", (req, res) => {
  let token = req.headers.token;
  let username = users.get(token);
  
  // Error messages
  if (!users.has(token)) {
      res.send(JSON.stringify({ success: false, "reason":"Invalid token" }))
      return
  }
  
  if (!carts.has(username) || carts.get(username)["usrCartItems"].length === 0) {
      res.send(JSON.stringify({ success: false, "reason":"Empty cart" }))
      return
  }
  
  let checkStocks = carts.get(username)["usrCartItems"];

  for (let i = 0; i < checkStocks.length; i++){
    let itemId = checkStocks[i];
    
    if (items.get(itemId)["itemSold"]) {
        res.send(JSON.stringify({ success: false, "reason":"Item in cart no longer available" }))
        return
    }
  }
  
  // Success
  let usrCartItems = carts.get(username)["usrCartItems"];
        
  for (let i = 0; i < usrCartItems.length; i++){
      let itemId = usrCartItems[i];

      if (purchases.has(username)) {
          ///////////////////////
          purchases.get(username)["usrPurchasedItems"].push(itemId);
      } else {
          purchases.set(username, { usrPurchasedItems: [itemId] });
      }
    
      items.get(itemId)["itemSold"] = true;
  }

  // Clear the array to empty the cart after checkout
  usrCartItems = [];
  
  res.send(JSON.stringify({ success: true }));
});

app.get("/purchase-history", (req, res) => {
  let token = req.headers.token;
  
  // Error messages
  if (!users.has(token)) {
      res.send(JSON.stringify({ success: false, "reason":"Invalid token" }))
      return
  }
  
  // Success
  let username = users.get(token);
  let purchasesArr = [];
  let usrPurchasedItems = purchases.get(username)["usrPurchasedItems"];

  for (let i = 0; i < usrPurchasedItems.length; i++) {
      let item = items.get(usrPurchasedItems[i]);
    
      let itemInfo = {
          price: item["price"],
          description: item["description"],
          itemId: usrPurchasedItems[i],
          sellerUsername: item["user"]
      }
      
      purchasesArr.push(itemInfo);
  }
  
  res.send(JSON.stringify({ success: true, purchased: purchasesArr }));
});

app.post("/chat", (req, res) => {
  let token = req.headers.token;
  let parsed
  // If req.body is empty return empty object (or else theres an error)
  if (Object.keys(req.body).length === 0) {
      parsed = {};
  } else {
      parsed = JSON.parse(req.body);
  }
  let destination = parsed.destination;
  let contents = parsed.contents;
  
  let username = users.get(token);
  
  // Error messages
  if (!users.has(token)) {
      res.send(JSON.stringify({ success: false, "reason":"Invalid token" }))
      return
  }
  
  if (destination === undefined) {
      res.send(JSON.stringify({ success: false, "reason":"destination field missing" }))
      return
  }
  
  if (contents === undefined) {
      res.send(JSON.stringify({ success: false, "reason":"contents field missing" }))
      return
  }
  
  let actualUsr
  
  for (let [key, value] of users) {
    console.log("users: " + value)
    if (destination === value) {
      actualUsr = true
    } 
  }
  
  if (!actualUsr) {
      res.send(JSON.stringify({ success: false, "reason":"Destination user does not exist" }))
      return
  }
  
  // Success
  let marketplaceChat = [username, destination].sort()
  let chatId = JSON.stringify(marketplaceChat)
  let message = {
      from: username,
      contents: contents,
  }

  if (chats.has(chatId)){
    ////////////////////
    chats.get(chatId)["messages"].push(message);
  } else {
    chats.set(chatId, { "messages": [message] });
  }

  res.send(JSON.stringify({ success: true }));
});

app.post("/chat-messages", (req, res) => {
  let token = req.headers.token;
  let parsed
  // If req.body is empty return empty object (or else theres an error)
  if (Object.keys(req.body).length === 0) {
      parsed = {};
  } else {
      parsed = JSON.parse(req.body);
  };
  let destination = parsed.destination;
  let username = users.get(token);
  
  // Error messages
  if (!users.has(token)) {
      res.send(JSON.stringify({ success: false, "reason":"Invalid token" }))
      return
  }
  
  if (destination === undefined) {
      res.send(JSON.stringify({ success: false, "reason":"destination field missing" }))
      return
  }
  
  let actualUsr
  
  for (let [key, value] of users) {
    console.log("users: " + value)
    if (destination === value) {
      actualUsr = true
    } 
  }
  
  if (!actualUsr) {
      res.send(JSON.stringify({ success: false, "reason":"Destination user not found" }))
      return
  }
  
  // Success
  let marketplaceChat = [username, destination].sort()
  let chatId = JSON.stringify(marketplaceChat)
  let msg = chats.get(chatId)["messages"]

  res.send(JSON.stringify({ success: true, messages: msg }));
});

app.post("/ship", (req, res) => {
  let token = req.headers.token;
  let parsed = JSON.parse(req.body);
  let itemId = parsed.itemid;
  
  // Error messages
  
  if (items.get(itemId)["itemSold"] === false) {
      res.send(JSON.stringify({ success: false, "reason":"Item was not sold" }))
      return
  }
  
  if (shippedItems.has(itemId)) {
      res.send(JSON.stringify({ success: false, "reason":"Item has already shipped" }))
      return
  }
  
  let username = users.get(token);
  
  if (items.get(itemId)["user"] !== username) {
      res.send(JSON.stringify({ success: false, "reason":"User is not selling that item" }))
      return
  }
  
  
  // Success
  shippedItems.set(itemId, username);
  
  res.send(JSON.stringify({ success: true }));
});

app.get("/status", (req, res) => {
  let itemId = req.query.itemid
  let token = req.headers.token;
  let username = users.get(token);
  
  // Error messages
  if (items.get(itemId)["itemSold"] === false) {
      res.send(JSON.stringify({ success: false, "reason":"Item not sold" }))
      return
  }
  
  // Success
  if (shippedItems.has(itemId)) {
      res.send(JSON.stringify({ success: true, "status":"shipped" }))
      return
  }
  
  if (!shippedItems.has(itemId)) {
      res.send(JSON.stringify({ success: true, "status":"not-shipped" }))
      return
  }
  
});

app.post("/review-seller", (req, res) => {
  let token = req.headers.token;
  let parsed = JSON.parse(req.body);
  let numStars = parsed.numStars;
  let contents = parsed.contents;
  let itemId = parsed.itemid;
  ///
  let username = users.get(token);
  let product = items.get(itemId);
  
  // Error messages
  if (!users.has(token)) {
      res.send(JSON.stringify({ success: false, "reason":"Invalid token" }))
      return
  };
  
  let seller = product["user"];
  
  if (reviews.has(seller)){
    let theReviews = reviews.get(seller)["reviews"];

    // Go over all the reviews to check the ids already reviewed
    for (let i = 0; i < theReviews.length; i++) {
        let review = theReviews[i];

        if (review["itemId"] === itemId) {
            res.send(JSON.stringify({ success: false, "reason":"This transaction was already reviewed" }))
            return
        }
    }
  }
  
  if (purchases.has(username)) {
    let itemsBought = purchases.get(username)["usrPurchasedItems"];
    let isBought = false;

    for (let i = 0; i < itemsBought.length; i++){
        let boughtItem = itemsBought[i];

        if (boughtItem === itemId) {
            isBought = true;
            break
        }
    }
    
    if (isBought === false) {
        res.send(JSON.stringify({ success: false, "reason":"User has not purchased this item" }))
        return
    }
  }
  
  // Success
  let reviewInfo = {
    "numStars": numStars,
    "contents": contents,
    "itemId": itemId,
  }
  
  let seeReviews = {
    "from": username,
    "numStars": numStars,
    "contents": contents,
  }
  
  if (reviews.has(seller)){
      ///////////////////
      let specificReview = reviews.get(seller)
      specificReview["reviews"].push(reviewInfo)
      specificReview["showReviews"].push(seeReviews)
  } else {
      reviews.set(seller , { "reviews": [reviewInfo] , "showReviews": [seeReviews] });
  }
  
  res.send(JSON.stringify({ success: true }));
});

app.get("/reviews", (req, res) => {
  let sellerUsername = req.query.sellerUsername
  let specifiedReviews = reviews.get(sellerUsername)["showReviews"]

  // Success
  res.send(JSON.stringify({ success: true, reviews: specifiedReviews }));
});

//

app.get("/sourcecode", (req, res) => {
  res.send(require('fs').readFileSync(__filename).toString())
});

// listen for requests :)
app.listen(process.env.PORT || 3000)
