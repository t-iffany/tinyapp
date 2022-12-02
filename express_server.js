const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// set ejs as the view engine
app.set('view engine', 'ejs');

// Middleware

// body-parser library converts the request body from a Buffer into a readable string
app.use(express.urlencoded({ extended: true }));

// Use bcrypt to store passwords
const bcrypt = require('bcryptjs');

// cookie-session serves as cookie-parser and also encrypts our cookies
const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// require helpers.js module for helper function
const { getUserByEmail } = require('./helpers');

// Implement function that returns a string of 6 random alphanumeric characters
function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};

// function which returns an object of userUrls where the userID is equal to the id of the currently logged-in user
function urlsForUser(id) {
  const userUrls = {};
  for (const shortUrlId in urlDatabase) {
    if (urlDatabase[shortUrlId].userID === id) {
      userUrls[shortUrlId] = urlDatabase[shortUrlId];
    }
  }
  return userUrls;
};

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },

  s9m5xK: {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  },
};

const usersDatabase = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'pw1',
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'pw2',
  },
};


// ROUTES
// ADD

// 'Create New URL' Form for user to fill in. Route to render the urls_new.ejs template to present form to the user.
app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: usersDatabase[req.session.user_id]
  };
  // if user is not logged in, redirect to GET /login
  if (!usersDatabase[req.session.user_id]) {
    return res.redirect('/login');
  }
  return res.render('urls_new', templateVars);
});


// route for url shortened form 
app.get('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];
  // if short URL ID does not exist (:id is not in the database)
  if (!url) {
    return res.send('Short URL ID does not exist');
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[shortURL].longURL,
    user: usersDatabase[req.session.user_id]
  };
  // if user is not logged in, return error message
  if (!usersDatabase[req.session.user_id]) {
    return res.send("This page is not accessible. You are not logged in.");
  }
  // if user do not own the URL page, it should not be accessible, return error message
  const userUrls = urlsForUser(req.session.user_id);
  // check if this object has the key of the short URL
  if (!userUrls[req.params.id]) {
    return res.send("This page does not belong to your user account");
  }
  return res.render('urls_show', templateVars);
});


// route to handle shortURL requests; when you click on short URL ID, you will be redirected to the longURL
app.get("/u/:id", (req, res) => {
  const url = urlDatabase[req.params.id];
  // if short URL ID does not exist (:id is not in the database)
  if (!url) {
    return res.send('Short URL ID does not exist');
  }
  return res.redirect(url.longURL);
});

// homepage
app.get("/", (req, res) => {
  return res.send("Hello! Homepage");
});

// output JSON string representing the entire urlDatabase object
app.get("/urls.json", (req, res) => {
  return res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  return res.send("<html><body>Hello <b>World</b></body></html>\n");
});


// EDIT

// POST route that updates a URL resource and have it update the value of your stored long URL
app.post("/urls/:id", (req, res) => {

  // if short URL ID does not exist
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
    return res.send('Short URL ID does not exist');
  };

  // if user is not logged in
  if (!usersDatabase[req.session.user_id]) {
    return res.send('You are not logged in and cannot edit');
  };

  // if user does not own the URL
  const userUrls = urlsForUser(req.session.user_id);
  if (!userUrls[req.params.id]) {
    return res.send("This page does not belong to your user account and you cannot edit");
  };

  const newID = req.params.id;
  urlDatabase[newID].longURL = req.body.newURL;
  res.redirect(`/urls`);
});


// DELETE

// POST route that deletes/removes a URL resource
app.post("/urls/:id/delete", (req, res) => {

  // if short URL ID does not exist
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
    return res.send('Short URL ID does not exist');
  };

  // if user is not logged in
  if (!usersDatabase[req.session.user_id]) {
    return res.send('You are not logged in and cannot delete');
  };

  // if logged in AND user does not own the URL
  const userUrls = urlsForUser(req.session.user_id);
  if (!userUrls[req.params.id]) {
    return res.send("This page does not belong to your user account and you cannot delete");
  };

  const idToDelete = req.params.id;
  delete urlDatabase[idToDelete];
  return res.redirect('/urls');
});


// BROWSE
// route handler for '/urls', use res.render() to pass the URL data to our template
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.user_id),    
    user: usersDatabase[req.session.user_id]
  };
  // if user is not logged in, return error message 
  if (!usersDatabase[req.session.user_id]) {
    return res.send('You are not logged in');
  }
  return res.render('urls_index', templateVars);
});


// Takes data submitted into the form and creates new random short URL ID
app.post("/urls", (req, res) => {
  if (!usersDatabase[req.session.user_id]) {
    return res.send('Please log in to shorten URLs');
  };

  const newKey = generateRandomString();    // newKey is newly generated short URL ID
  urlDatabase[newKey] = {        // new short URL ID now an object with values longURL and cookie with user_id
    longURL: req.body.longURL,
    userID: req.session.user_id,
  };
  return res.redirect(`/urls/${newKey}`);
});


// GET /register endpoint which returns registration template
app.get("/register", (req, res) => {
  const templateVars = {
    user: usersDatabase[req.session.user_id]
  };
  // if user is logged in, should redirect to GET /urls
  if (!usersDatabase[req.session.user_id]) {
    return res.render('urls_registration', templateVars);
  }
  return res.redirect('/urls');
});


// POST /register endpoint to handle registration form data
app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(enteredPassword, 10);

  if (!enteredEmail || !enteredPassword) {
    return res.status(400).send("Please enter a valid email and password");
  };

  if (getUserByEmail(enteredEmail, usersDatabase)) {
    return res.status(400).send("Account with this email already exists");
  };

  const newUserID = generateRandomString();
  usersDatabase[newUserID] = {
    id: newUserID,
    email: enteredEmail,
    password: hashedPassword
  };

  req.session.user_id = newUserID;
  return res.redirect("/urls");
});


// GET /login endpoint which returns login template
app.get("/login", (req, res) => {
  const templateVars = {
    user: usersDatabase[req.session.user_id]
  };
  // if user is logged in, should redirect to GET /urls
  if (!usersDatabase[req.session.user_id]) {
    return res.render('urls_login', templateVars);
  }
  return res.redirect('/urls');
});


// endpoint to handle a POST to /login
app.post("/login", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

  // error if email is not currently registered
  if (!getUserByEmail(enteredEmail, usersDatabase)) {
    return res.status(403).send("User with that email cannot be found");

  } else {
    // error if enteredPassword is not same as password registered to that userID
    const existingUser = getUserByEmail(enteredEmail, usersDatabase);

    //if (enteredPassword !== users[existingUserID].password) {
    if (!bcrypt.compareSync(enteredPassword, usersDatabase[existingUser.id].password)) {
      return res.status(403).send("Incorrect password");

    } else {
      //if email exists and passwords match, set cookie to the user id
      //res.cookie("user_id", existingUserID);
      req.session.user_id = existingUser.id;
      return res.redirect("/urls");
    }
  }
});


// endpoint to handle a POST to /logout
app.post("/logout", (req, res) => {
  //res.clearCookie('user_id');
  req.session = null;
  return res.redirect('/login');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});