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

function checkEmailExists(pEmail) {
  // function returns true if an e-mail exists in the data base
  //console.log("Quering e-mail: ", pEmail);
  for (userObject in users) {
    console.log(users[userObject].email);
    
    // move through the users objects
    if (users[userObject].email.toLowerCase() === pEmail.toLowerCase()) {
      //console.log("returned true!");
      return true;
    }
  }
  return false; 
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
  // This should be a landing page
  let userObject = users[req.cookies["user_id"]];
  let tempVars = {user: userObject};
  res.render("home", tempVars);
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
  let userObject = users[req.cookies["user_id"]];
  let templateVars = { urls: urlDatabase, user: userObject };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let userObject = users[req.cookies["user_id"]];
  let templateVars = { user: userObject };
  res.render("urls_new", templateVars );
  
});
app.get("/register", (req, res)=> {
  // Will serve up the registration page template
  res.render("register");
});

app.get("/urls/:shortURL", (req, res) => {
  let userObject = users[req.cookies["user_id"]];
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: userObject };
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
  // handles registration submission.

  // Retrieve the username and password
  const gemail = req.body.email;
  const gpassword = req.body.password;
  const gid = generateRandomString(); // generate unique ID
  
  // Validate incoming data as per assignment instructions
  if (!gemail || !gpassword) {
    res.statusMessage = "Email address and/or password are not in a valid format";
    res.sendStatus(400); // Send a 404 error response
    return; // 
  }
  if (checkEmailExists(gemail)) {
    // if true, a matching e-mail has been found. Return a status 404
    res.statusMessage = "Email address already exists in the database."
    res.sendStatus(400);
    return;
  }
  // Create an object
  const newUserObject =  {
    id: gid,
    email:gemail,
    password: gpassword
  }
  users[gid] = newUserObject; // append to the object data base
  // set a cookie containing the newly generated ID
  res.cookie('user_id', gid);
  res.redirect('/urls');
})
