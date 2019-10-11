const express = require('express');
const bodyParser = require('body-parser');
const postsRoutes = require("./routes/posts");
const usersRoutes = require("./routes/users");
const app = express();
const path = require("path");

const mongoose = require('mongoose');

// mongoose.connect('mongodb://localhost/myudemyapp')
mongoose.connect("mongodb+srv://Michalis:" +
  process.env.MONGO_ATLAS_PW +
  "@cluster0-ezykd.mongodb.net/node-angular?retryWrites=true&w=majority",
  { useNewUrlParser: true }
)
  .then(() => {
    console.log('Connected to database!');
  })
  .catch(() => {
    console.log('Connection failed!');
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use("/images", express.static(path.join("images")));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods',
    'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  next();
});
app.use("/api/posts", postsRoutes);
app.use("/api/users", usersRoutes);
module.exports = app;

