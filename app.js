const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3001;
const mongoose = require("mongoose");
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static("public"));
var methodOverride = require("method-override");
app.use(methodOverride("_method"));
const allRoutes = require("./routes/allRoutes");
const addUserRoute = require("./routes/addUser");

app.use(express.json())
// cookie-parser
var cookieParser = require('cookie-parser')
app.use(cookieParser())

require('dotenv').config()

if (process.env.NODE_ENV === 'production') {
  app.set('view cache', true);
}

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/myapp')
  .then(() => {
    app.listen(3001, () => {
      console.log(`http://localhost:${3001}/`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

app.use(allRoutes);
app.use( "/user/add.html",addUserRoute);