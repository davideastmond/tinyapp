var express = require("express");
var cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");


var app = express();
app.set("view engine", "ejs"); // Set EJS as the default templating engine
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
var PORT = 8080; // default port 8080

function generateRandomString() {
  /** This function generates a string of random alpha numeric characters */
  const validChars = "abcdefghijklmnopqrstuvwxyz1234567890";

  let returnString = "";
  for (let i = 0; i < 6; i++) {
    let randomNumber = Math.floor(Math.random() * (validChars.length - 1 - 0) + 0);
    let shouldCap = Math.floor(Math.random() * (2 - 0) + 0);
    if (shouldCap === 1) {
      returnString += validChars[randomNumber].toUpperCase();
    } else {
      returnString += validChars[randomNumber];
    }
  }
  return returnString;
}
function cleanURL(inputURL) {
  // adds http to a URL w/ out the HTTP
  let returnURL = inputURL;
  if (!inputURL.startsWith("http://")) {
    returnURL = "http://" + inputURL;
  }
  return returnURL;
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Database for users
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
// Add a route
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Route handler for the URLS
app.get("/urls", (req, res)=> {
  
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {username: req.cookies["username"]}
  res.render("urls_new", templateVars );
  
});
app.get("/register", (req, res)=> {
  // Will serve up the registration page template
  res.render("register");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  
  req.body.longURL = cleanURL(req.body.longURL);
  // Add to the url
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect("/urls/" + randomString);
  console.log(urlDatabase);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  // Deletes a URL from the object
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];

  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req, res)=> {
  const shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  longURL = cleanURL(longURL);

  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res)=> {
  const username = req.body.username;
  console.log("got a login username: ", username);

  // set a cookie w/ username as a value and re-direct
  res.cookie('username', username); 
  res.redirect("/urls");
});

app.post("/logout", (req, res)=> {
  // User has clicked the log out button. Clear the cookie and direct them to the urls
  res.clearCookie('username');
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log("long URL IS: " + longURL);
  
  res.redirect(longURL);
});

app.post("/register", (req, res)=> {
  // handles registration submission
})
