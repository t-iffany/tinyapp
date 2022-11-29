const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// Implement function that returns a string of 6 random alphanumeric characters
function generateRandomString () {
  return Math.random().toString(36).substr(2, 6);
};

// set ejs as the view engine
app.set('view engine', 'ejs');

// body-parser library converts the request body from a Buffer into a readable string
app.use(express.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// BROWSE - HOMEPAGE
// route handler for '/urls', use res.render() to pass the URL data to our template
app.get('/urls', (req, res) => {
  const templateVars = {urls: urlDatabase};
  res.render('urls_index', templateVars);
});

// ADD

// 'Create New URL' Form for user to fill in
// route to render the urls_new.ejs template to present form to the user
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Takes data submitted into the form and creates new random short URL ID
// define the route that will match POST request and handle it
app.post("/urls", (req, res) => {
  const newKey = generateRandomString();
  const newValue = req.body.longURL;  // newValue is random string that = longURL
  urlDatabase[newKey] = newValue;  // inserting new key-value into object
  res.redirect(`/urls/${newKey}`);
});

// route for url shortened form 
app.get('/urls/:id', (req, res) => {
  const templateVars = {id: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render('urls_show', templateVars);
});

// route to handle shortURL requests; when you click on short URL ID, you will be redirected to the longURL
app.get("/u/:id", (req, res) => {
  // const longURL = ...
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
}); 

app.get("/", (req, res) => {
  res.send("Hello!");
});

// output JSON string representing the entire urlDatabse object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// EDIT

// DELETE
// POST route that deletes/removes a URL resource
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});