const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// Implement function that returns a string of 6 random alphanumeric characters
function generateRandomString () {
  return Math.random().toString(36).substr(2, 6);
};

// set ejs as the view engine
app.set('view engine', 'ejs');

// Middleware
// takes form data and putting it into req.body
// extended = false uses standard values ; extended = true uses non-standard values
// body-parser library converts the request body from a Buffer into a readable string
app.use(express.urlencoded({extended: true}));

// cookie-parser serves as Express middleware that helps us read the values from the cookie
const cookieParser = require("cookie-parser");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  sampleUser: {
    id: '',
    email: '',
    password: '',
  },

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
  res.render("urls_new");
});


// route for url shortened form 
app.get('/urls/:id', (req, res) => {
  const templateVars = {
    id: req.params.id, 
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies['user_id']]
  };
  res.render('urls_show', templateVars);
});

// route to handle shortURL requests; when you click on short URL ID, you will be redirected to the longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
}); 

// homepage
app.get("/", (req, res) => {
  res.send("Hello! Homepage");
});

// output JSON string representing the entire urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// EDIT
// POST route that updates a URL resource and have it update the value of your stored long URL
app.post("/urls/:id", (req, res) => {
  const newID = req.params.id;
  urlDatabase[newID] = req.body.newURL;
  res.redirect(`/urls`);
});

// DELETE
// POST route that deletes/removes a URL resource
app.post("/urls/:id/delete", (req, res) => {
  const idToDelete = req.params.id
  delete urlDatabase[idToDelete];
  res.redirect('/urls');
});

// BROWSE - HOMEPAGE
// route handler for '/urls', use res.render() to pass the URL data to our template
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  res.render('urls_index', templateVars);
});

// Takes data submitted into the form and creates new random short URL ID
app.post("/urls", (req, res) => {
  const newKey = generateRandomString();
  const newValue = req.body.longURL;  // newValue is random string that = longURL
  urlDatabase[newKey] = newValue;  // inserting new key-value into object
  res.redirect(`/urls/${newKey}`);
});

// GET /register endpoint which returns registration template
app.get("/register", (req, res) => {
  res.render('urls_registration');
});

// POST /register endpoint to handle registration form data
app.post("/register", (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const newUserID = generateRandomString();
  users[newUserID] = {
    id: newUserID,
    email: enteredEmail,
    password: enteredPassword
  };
  res.cookie("user_id", newUserID);
  console.log('object data:', users[newUserID]);
  res.redirect("/urls");
});

// endpoint to handle a POST to /login
app.post("/login", (req, res) => {
  const user = users[req.body['user_id']];
  res.cookie("user", user_id);
  res.redirect("/urls");
});

// endpoint to handle a POST to /logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});