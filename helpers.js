// Implement a function to look up users by their email from our users database. Takes in parameter email and our user database

const getUserByEmail = function(email, usersDatabase) {
  for (const user in usersDatabase) {
    if (usersDatabase[user].email === email) {
      return usersDatabase[user];
    }
  }
};

module.exports = { getUserByEmail };