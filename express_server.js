var express = require("express");
var cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");


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
    //console.log(users[userObject].email);
    
    // move through the users objects
    if (users[userObject].email.toLowerCase() === pEmail.toLowerCase()) {
      //console.log("returned true!");
      return true;
    }
  }
  return false; 
}

function validateUser(pEmail, pPwd) {
  // validates a email / password and returns a user object if validation is good
  for (userObject in users) {
    //console.log(users[userObject].email);
    
    // move through the users objects
    if (users[userObject].email.toLowerCase() === pEmail.toLowerCase()) {
      //console.log("returned true!");
      if (bcrypt.compareSync(pPwd, users[userObject].password)) {
        //if (users[userObject].password === pPwd) {
        return users[userObject];
      }
    }
  }
  console.log("User not found / e-mail or password invalid");
  return null;
}

var urlDatabase = {
  b2xVn2: {longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  ism5xK: {longURL: "http://www.google.com", userID: "user2RandomID"},
  u587Yn: {longURL: "http://www.abc.go.com", userID: "userRandomID"}
};

function urlsForUser(id) {
  // returns the URLs where the userID is equal to the id of the currently logged in user
  let returnObject = {};
  for (let urlObject in urlDatabase) {
    if (urlDatabase[urlObject].userID === id) {
      returnObject[urlObject] = urlDatabase[urlObject];
    }
  }
  return returnObject;
}

function updateURLDatabase(forID, forShortURL, withLongURL) {
  if (urlDatabase[forShortURL].userID === forID) {
    urlDatabase[forShortURL].longURL = withLongURL;  
  } else {
    console.log("updating urldb ", urlDatabase[forShortURL])
    return -1;
  }
  return 0;
}

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

// Start listening process
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

// Route handler for the URLs Index
app.get("/urls", (req, res)=> {
  let userObject = users[req.cookies["user_id"]];
  if (!userObject) {
    console.log("Not authenticated: redirecting");
    res.redirect("/");
  } else {
    // Instead of sending the entire database, send a filtered version
    let filtered_db = urlsForUser(userObject.id);
    let templateVars = { urls: filtered_db, user: userObject };
    res.render("urls_index", templateVars);
  }
  
});

app.get("/urls/new", (req, res) => {
  let userObject = users[req.cookies["user_id"]];

  if (!userObject) {
    console.log("User not logged in, redirecting");
    res.redirect("/login");
    return;
  }
  let templateVars = { user: userObject };
  res.render("urls_new", templateVars );
  
});
app.get("/register", (req, res)=> {
  // Will serve up the registration page template
  res.render("register");
});

app.get("/urls/:shortURL", (req, res) => {
  // View an individual shortURL entry
  let userObject = users[req.cookies["user_id"]];
  if (!userObject) {
    console.log("User not authenticated: redirecting");
    res.redirect("/");
  }
  
  // Get a filtered list and then only show that particular shortURL
  let filteredURLs = urlsForUser(userObject.id);
  console.log(" line 172 - user object ID: ", userObject.id);
  
  let templateVars = { shortURL: req.params.shortURL, longURL: filteredURLs[req.params.shortURL].longURL, user: userObject };
  res.render("urls_show", templateVars);
});

app.get("/urls/:shortURL/delete", (req, res)=> {
  // Find the shortURL
  let shortURL = req.params.shortURL;
  console.log("line 181 --", shortURL);
  delete urlDatabase[shortURL];
  res.redirect("/urls");
})

app.get("/login", (req, res) => {
  // Will render a login page to the client
  res.render("login");
})

app.post("/urls", (req, res) => {
  let userObject = users[req.cookies["user_id"]];
  if (!userObject) {
    console.log("User not logged in");
    res.redirect("/");
    return;
  } 
  
  // add the http:// if it's missing
  req.body.longURL = cleanURL(req.body.longURL);
  // Add to the url
  let randomString = generateRandomString();

  // Create a new entry in the urlDatabase object
  urlDatabase[randomString] = {longURL: req.body.longURL, userID: userObject.id};
  res.redirect("/urls/" + randomString); 
});

app.post("/urls/:shortURL/delete", (req, res) => {
  // Deletes a URL from the object
  const shortURL = req.params.shortURL;
  console.log("line 204 --- ", shortURL);
  delete urlDatabase[shortURL];

  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req, res)=> {
  // Update a specific url by userID /
  const shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  longURL = cleanURL(longURL);
  console.log(shortURL, " ", longURL);

  let userObject = users[req.cookies["user_id"]];
  if (!userObject) {
    console.log("User not authenticated: redirecting");
    res.redirect("/");
  } else {
    let result = updateURLDatabase(userObject.id, shortURL, longURL);
    if (result < 0) {
      console.log("There was a problem updating the URL entry.");
    } else {
      console.log("URL UPDATE should be good");
      res.redirect("/urls");
    }
  }

  
});

app.post("/login", (req, res)=> {
  // retrieve values from the body
  const email = req.body.email;
  const password = req.body.password;
  console.log("got a login e-mail: ", email, password);

  // Look up the e-mail in the DB
  if(checkEmailExists(email))
  {
    // E-mail exists, validate the user
    let userObj = validateUser(email, password);
    if (userObj === null) {
      console.log(email, " ", password);
      console.log("object", userObj);
      res.sendStatus(401);
      return;
    } else {
      // checks should pass
      console.log(`User ${userObj.email} has been successfully authenticated`);
      res.cookie('user_id', userObj.id);
      res.redirect('/urls');
    }
  } else {
    res.sendStatus(401);
  }
});

app.post("/logout", (req, res)=> {
  // User has clicked the log out button. Clear the cookie and direct them to the home page
  res.clearCookie('user_id');
  res.redirect("/");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  console.log("long URL IS: " + longURL);
  
  res.redirect(longURL);
});

app.post("/register", (req, res)=> {
  // handles registration submission.

  // Retrieve the e-mail and password from the body
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
  // Create an object - hash the password
  let hashedPassword = bcrypt.hashSync(gpassword, 10);
  console.log("line 306 = ", hashedPassword);
  const newUserObject =  {
    id: gid,
    email:gemail,
    password: hashedPassword
  }
  users[gid] = newUserObject; // append to the object data base
  // set a cookie containing the newly generated ID
  res.cookie('user_id', gid);
  res.redirect('/urls');
})
