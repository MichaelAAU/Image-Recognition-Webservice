const express = require("express");
const router = express.Router();
const User = require('../models/user');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/signup", (req, res, next) => {
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: req.body.email,
        password: hash
      });
      user.save()
        .then(result => {
          res.status(201).json({
            message: 'User created!',
            result: result // add Auth token
          })
        })
        .catch(err => {
          res.status(500).json({
            message: "Invalid authentication credentials!"
          })
        })
  });
});

router.post("/login", (req, res, next) => {
  let fetchedUser;
  User.findOne({email: req.body.email})
    .then(user => {
      // console.log(user);
      if (!user) {
        return res.status(401).json({
          message: "Auth failed"
        })
      }
      fetchedUser = user;
      return bcrypt.compare(req.body.password, user.password)
    })
    .then(result => {
      // console.log(result);
      if (!result) {
        return res.status(401).json({
          message: "Auth failed"
        })
      }
      const token = jwt.sign(
        {email: fetchedUser.email, userId: fetchedUser._id},
        process.env.JWT_KEY,
        {expiresIn: '1h'});
      // console.log(token);
      res.status(200).json({
        token: token,
        expiresIn: 3600,
        userId: fetchedUser._id
      })
    })
    .catch(err => {
      console.log(err);
      return res.status(401).json({
        message: "Invalid authentication credentials!"
      })
    })
});

module.exports = router;
