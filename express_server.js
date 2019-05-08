var express = require("express");
const bodyParser = require("body-parser");


var app = express();
app.set("view engine", "ejs"); // Set EJS as the default templating engine
app.use(bodyParser.urlencoded({extended: true}));
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

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
  let templateVars = { urls: urlDatabase };
  
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  
  if (!req.body.longURL.startsWith("http://")) {
    req.body.longURL = "http://" + req.body.longURL;
  }
  // Add to the url
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect("/urls/" + randomString);
  console.log(urlDatabase);
});
app.post("/urls/:shortURL/delete")

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log("long URL IS: " + longURL);
  
  res.redirect(longURL);
});
