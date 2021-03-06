/*
HTTP server app that allows users to shorten long URLs much like TinyURL.com and bit.ly do.
*/
var express = require("express");
var cookieParser = require("cookie-parser");
var cookie_session = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs"); 
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookie_session({
  name: 'session',
  keys:["password"]
}));

function generateRandomString() {
  /** This function generates a string of random alpha numeric characters */
  const validChars = "abcdefghijklmnopqrstuvwxyz1234567890";

  let returnString = "";
  for (let i = 0; i < 6; i++) {
    let randomNumber = Math.floor(Math.random() * (validChars.length - 1 - 0) + 0);
    const shouldCap = Math.floor(Math.random() * (2 - 0) + 0);
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
  // a helper function returns true if an e-mail exists in the data base
  for (let userObject in users) {
    if (users[userObject].email.toLowerCase() === pEmail.toLowerCase()) {
      return true;
    }
  }
  return false; 
}

function validateUser(pEmail, pPwd) {
  // validates a email / password and returns a user object if validation is good
  for (let userObject in users) {
    // move through the users objects
    if (users[userObject].email.toLowerCase() === pEmail.toLowerCase()) {
      if (bcrypt.compareSync(pPwd, users[userObject].password)) {
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
  /* helper function that adds a URL record to the databse*/
  if (urlDatabase[forShortURL].userID === forID) {
    urlDatabase[forShortURL].longURL = withLongURL;  
  } else {
    return -1;
  }
  return 0;
}

// Database for users
const users = {};

function createTestUsers(numUsers) {
  /** This function creates default users with secure passwords (normally for testing) 
   * Ensure to call the function
  */
 
  for (let i = 0; i < numUsers; i++) {
    const hashedPassword = bcrypt.hashSync("password", 10);
    const randomUserID = generateRandomString();
    const randomEmail = randomUserID + "@mail.com";
    const defaultUser = {id: randomUserID, email: randomEmail, password: hashedPassword};
    users[randomUserID] = defaultUser;
  }
  console.log("line 108 " + numUsers + " users added.");
  console.log(users);
}

app.get("/", (req, res) => {
  /* If the user logged in, redirect to the /urls page, otherwise show login page */
  const key = req.session.user_id;
  const userObject = users[key];
  
  if (userObject) {
    res.redirect("/urls");
    return;
  } else {
    res.redirect("/login");
  }
});

// Route handler for the URLs Index
app.get("/urls", (req, res)=> {
  const key = req.session.user_id;
  const userObject = users[key];

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
  // Renders the page to allow user to create shortURL
  let key = req.session.user_id;
  let userObject = users[key];
  if (!userObject) {
    // User is not logged in, redirect to login page
    res.redirect("/login");
    return;
  }
  let templateVars = { user: userObject };
  res.render("urls_new", templateVars );
});

app.get("/register", (req, res)=> {
  /* Will serve up the registration page template. If the user is logged in,
  redirect them to the urls page*/
  let key = req.session.user_id;
  let userObject = users[key];
  if (!userObject) {
    // User is not logged in, redirect to login page
    res.render("register");
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  // View an individual shortURL entry
  const key = req.session.user_id;
  const userObject = users[key];
  if (!userObject) {
    res.sendStatus(401);
    return;
  }
  // check if a url even exists and return appropriate response
  if (!urlDatabase[req.params.shortURL]) {
    res.sendStatus(404);
    return;
  }

  // Get a filtered list and then only show that particular shortURL
  const filteredURLs = urlsForUser(userObject.id);

  // If this object is null, that means the URL does not belong to the currently
  // logged in user; throw a status code 404
  if (Object.keys(filteredURLs).length === 0) {
    res.sendStatus(401);
    return;
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: filteredURLs[req.params.shortURL].longURL, user: userObject };
  res.render("urls_show", templateVars);
});

app.get("/login", (req, res) => {
  // If there is a session, redirect to the urls
  const key = req.session.user_id;
  const userObject = users[key];

  if (userObject) {
    res.redirect("/urls");
  } else {
    res.render("login");
  }
});

app.get("/u/:shortURL", (req, res) => {
  /* Redirects user to the appropriate longURL provided the shortURL is valid
  otherwise, return an error */
  if (!urlDatabase[req.params.shortURL]) {
    res.sendStatus(404);
    return;
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  /* Generates a shortURL (with a randomly generated ID), saves it and 
  associates it with the user */
  const key = req.session.user_id;
  const userObject = users[key];

  if (!userObject) {
    res.sendStatus(401);
    return;
  } 
  
  // For consistency, clean-up the URL if it's missing the protocol
  req.body.longURL = cleanURL(req.body.longURL);
  const randomString = generateRandomString();
  urlDatabase[randomString] = {longURL: req.body.longURL, userID: userObject.id};
  res.redirect("/urls/" + randomString); 
});

app.post("/urls/:shortURL/delete", (req, res) => {
  /* Deletes a shortURL, but first checks that the request is from the user who created
  the shortURL. */
  const key = req.session.user_id;
  const userObject = users[key];

  if (!userObject) {
    res.sendStatus(400);
    return;
  }

  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === userObject.id) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.sendStatus(401);
  }
});

app.post("/urls/:shortURL/update", (req, res)=> {
  // Updates the shortURL and re-directs the user
  const shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  longURL = cleanURL(longURL);

  const key = req.session.user_id;
  const userObject = users[key];
  if (!userObject) {
    res.redirect("/");
  } else {
    const result = updateURLDatabase(userObject.id, shortURL, longURL);
    if (result < 0) {
      res.sendStatus(400);
    } else {
      res.redirect("/urls");
    }
  }
});

app.post("/login", (req, res)=> {
  /* This route autheticates the user (looks up the email address/password) 
  and sets a cookie, then redirects the user to /urls. If authentication fails
  return the appropriate error code */

  const email = req.body.email;
  const password = req.body.password;

  if(checkEmailExists(email)) {
    const userObj = validateUser(email, password);
    if (userObj === null) {
      res.sendStatus(401);
      return;
    } else {
      console.log(`User ${userObj.email} has been successfully authenticated`);
      req.session.user_id = userObj.id;
      res.redirect('/urls');
    }
  } else {
    res.sendStatus(401);
  }
});

app.post("/logout", (req, res)=> {
  // This route clears the cookie and directs them to the root (home page)
  req.session = null;
  res.redirect("/");
});

app.post("/register", (req, res)=> {
  /* Handles registration submission. It will extract email and password
  and check for duplicate emails in the db and return the appropriate message.
  It will also validate the email.

  Once all is good, generate a unique random userID hash the password and add 
  the record to the db.
  */
  
  const gemail = req.body.email;
  const gpassword = req.body.password;
  const gid = generateRandomString(); 
  
  if (!gemail || !gpassword) {
    res.statusMessage = "Email address and/or password are not in a valid format";
    res.sendStatus(400);
    return; 
  }
  if (checkEmailExists(gemail)) {
    res.statusMessage = "Email address already exists in the database.";
    res.sendStatus(400);
    return;
  }
  // Create an object - hash the password
  const hashedPassword = bcrypt.hashSync(gpassword, 10);
  const newUserObject =  {
    id: gid,
    email:gemail,
    password: hashedPassword
  };

  /* append to the object data base
  set a cookie containing the newly generated ID */
  users[gid] = newUserObject; 
  req.session.user_id = gid;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});