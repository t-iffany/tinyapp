const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// set ejs as the view engine
app.set('view engine', 'ejs');

// Middleware
// takes form data and putting it into req.body
// extended = false uses standard values ; extended = true uses non-standard values
// body-parser library converts the request body from a Buffer into a readable string
app.use(express.urlencoded({ extended: true }));

// cookie-parser serves as Express middleware that helps us read the values from the cookie
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Implement function that returns a string of 6 random alphanumeric characters
function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};

// Implement a function to check if email already exists. It takes an email as a parameter and return either the entire user object or null if not found
function ifEmailExists(email) {
  for (const user in users) {
    if (email === users[user].email) {
      return users[user].id;
    };
  };
  return false;
};

const urlDatabase = {
  // change structure of urlDatabse so id(ie. b2xVn2) stays as key, its value becomes an object that has longURL and userID keys
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },

  s9m5xK: {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  },
};

const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'pizzapw',
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'chocolatepw',
  },
};


// ROUTES

// ADD


// 'Create New URL' Form for user to fill in
// route to render the urls_new.ejs template to present form to the user
app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  // if user is not logged in, redirect to GET /login
  if (!req.cookies['user_id']) {
    return res.redirect('/login');
  }
  return res.render('urls_new', templateVars);
});


// route for url shortened form 
app.get('/urls/:id', (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.cookies['user_id']]
  };
  return res.render('urls_show', templateVars);
});

// route to handle shortURL requests; when you click on short URL ID, you will be redirected to the longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  // if short URL ID does not exist (:id is not in the database)
  if (longURL === undefined) {
    return res.send('Short URL ID does not exist');
  }
  return res.redirect(longURL);
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
  const newID = req.params.id;
  urlDatabase[newID] = req.body.newURL;
  return res.redirect(`/urls`);
});

// DELETE
// POST route that deletes/removes a URL resource
app.post("/urls/:id/delete", (req, res) => {
  const idToDelete = req.params.id;
  delete urlDatabase[idToDelete];
  return res.redirect('/urls');
});

// BROWSE - HOMEPAGE
// route handler for '/urls', use res.render() to pass the URL data to our template
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  return res.render('urls_index', templateVars);
});

// Takes data submitted into the form and creates new random short URL ID
app.post("/urls", (req, res) => {
  if (!req.cookies['user_id']) {
    return res.send('Please log in to shorten URLs');
  };
  const newKey = generateRandomString();    // newKey is newly generated short URL ID
  urlDatabase[newKey] = {        // new short URL ID now an object with values longURL and cooke with user_id
    longURL: req.body.longURL,
    userID: req.cookies['user_id'],
  };
  return res.redirect(`/urls/${newKey}`);
});

// GET /register endpoint which returns registration template
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']]
  };
  // if user is logged in, should redirect to GET /urls
  if (!req.cookies['user_id']) {
    return res.render('urls_registration', templateVars);
  }
  return res.redirect('/urls');
});

// POST /register endpoint to handle registration form data
app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

  if (!enteredEmail || !enteredPassword) {
    return res.status(400).send("Please enter a valid email and password");
  };

  if (ifEmailExists(enteredEmail)) {
    return res.status(400).send("Account with this email already exists");
  };

  const newUserID = generateRandomString();
  users[newUserID] = {
    id: newUserID,
    email: enteredEmail,
    password: enteredPassword
  };

  res.cookie("user_id", newUserID);
  return res.redirect("/urls");
});

// GET /login endpoint which returns login template
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']]
  };
  // if user is logged in, should redirect to GET /urls
  if (!req.cookies['user_id']) {
    return res.render('urls_login', templateVars);
  }
  return res.redirect('/urls');
});

// endpoint to handle a POST to /login
app.post("/login", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  // error if email is not currently registered
  if (!ifEmailExists(enteredEmail)) {
    return res.status(403).send("User with that email cannot be found");

  } else {
    // error if enteredPassword is not same as password registered to that userID
    const existingUserID = ifEmailExists(enteredEmail);

    if (enteredPassword !== users[existingUserID].password) {
      return res.status(403).send("Incorrect password");

    } else {
      // if email exists and passwords match, set cookie to the user id
      res.cookie("user_id", existingUserID);
      return res.redirect("/urls");
    }
  }
});

// endpoint to handle a POST to /logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  return res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});