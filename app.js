const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started successfully at port 3000");
    });
  } catch (error) {
    console.log(`Database error ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// API-1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const isExistQuery = `
  SELECT * FROM user 
  WHERE username = '${username}';`;

  const isExist = await database.get(isExistQuery);
  if (isExist === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const createQuery = `
          INSERT INTO user(username, name, password, gender, location)
          VALUES(
              '${username}',
              '${name}',
              '${hashedPassword}',
              '${gender}',
              '${location}'
          );`;
      await database.run(createQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API-2 login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const isExistQuery = `
    SELECT * FROM user
    WHERE username = '${username}';`;

  const isExist = await database.get(isExistQuery);

  if (isExist === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const userPassword = isExist.password;
    const isPasswordMatched = await bcrypt.compare(password, userPassword);
    if (isPasswordMatched) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API-3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const userExistQuery = `
  SELECT * FROM user
  WHERE username = '${username}';`;

  const userDetails = await database.get(userExistQuery);
  const userPassword = userDetails.password;
  const isPasswordMatched = await bcrypt.compare(oldPassword, userPassword);

  if (isPasswordMatched) {
    const newPasswordLength = newPassword.length;
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
      UPDATE 
        user
      SET 
        password = '${hashedPassword}'
      WHERE 
        username = '${username}';`;
      await database.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
