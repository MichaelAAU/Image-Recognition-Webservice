const express = require("express");
const router = express.Router();
const Post = require('../models/post');
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const checkAuth = require("../middleware/check-auth");
const ObjectID = require('mongodb').ObjectID;

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg'
};

const config = new AWS.Config({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

s3 = new AWS.S3();

AWS.config.update({region:process.env.AWS_REGION});
const client = new AWS.Rekognition();
const myBucket = 'photo-angular';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // console.log(file.mimetype);
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error("Invalid mime type");
    if (isValid) {
      error = null;
    }
    cb(error, "images");
  },
  filename: (req, file, cb) => {
    const name = file.originalname.toLowerCase().split(' ').join('-');
    const ext = MIME_TYPE_MAP[file.mimetype];
    cb(null, name + '-' + Date.now() + '.' + ext);
  }
});

const storage2 = multerS3({
  s3: s3,
  bucket: myBucket,
  key: (req, file, cb) => {
    const name = file.originalname.toLowerCase().split(' ').join('-');
    const ext = MIME_TYPE_MAP[file.mimetype];
    let error = new Error("Invalid mime type");
    if (ext) {
      error = null;
    }
    cb(error, name + '-' + Date.now() + '.' + ext);
  }
});

router.post(
  "",
  checkAuth,
  multer({storage: storage2}).single('image'),
  (req, res, next) => {
  // console.log(req);
  // console.log("File "+ req.file.key);
  // console.log("File "+ req.file.filename);
  const params = {
    Image: {
      S3Object: {
        Bucket: myBucket,
        Name: req.file.key
      },
    },
    MaxLabels: 20,
    MinConfidence: 90
  };
  client.detectLabels(params, function(err, response) {
    if (err) {
      console.log(err, err.stack); // an error occurred
    } else {
      // const url = req.protocol + '://' + req.get('host');
      // console.log(url);
      // imagePath: url + '/images/' + req.file.key
      const postObj = {
        title: req.body.title,
        content: req.body.content,
        imagePath: req.file.location,
        creator: req.userData.userId,
        labels: []
      };
      response.Labels.forEach(label => {
        postObj['labels'].push(
          {
            name: label.Name,
            confidence: label.Confidence
          }
        );
      }); // for response.labels
      // console.log(postObj);
      const post = new Post(postObj);
      post.save().then(createdPost => {
        // console.log(createdPost);
        res.status(201).json({
          message: 'Post added successfully',
          post: {
            // ...createdPost,
            id: createdPost._id,
            title: createdPost.title,
            content: createdPost.content,
            imagePath: createdPost.imagePath,
            creator: req.userData.userId,
            labels: response.Labels
          }
        })
      })
      .catch(error => {
        res.status(500).json({
          message: 'Creating a post failed!'
        })
      })
    } // if
  });
});

router.put(
  "/:id",
  checkAuth,
  multer({storage: storage2}).single('image'),
  (req, res, next) => {
  // console.log(req.file);
  // console.log("File "+ req.file.key);
  const params = {
    Image: {
      S3Object: {
        Bucket: myBucket,
        Name: req.file.key
      },
    },
    MaxLabels: 20,
    MinConfidence: 90
  };
  client.detectLabels(params, function(err, response) {
    if (err) {
      console.log(err, err.stack); // an error occurred
    } else {
      labels2 = [];
      response.Labels.forEach(label => {
        labels2.push(
          {
            _id: new ObjectID(),
            name: label.Name,
            confidence: label.Confidence
          }
        );
      }); // for response.labels
      // console.log(postObj);
      // console.log(req.params.id);
      // console.log(req.userData.userId);
      Post.findOneAndUpdate({_id: req.params.id, creator: req.userData.userId},
        {title: req.body.title, content: req.body.content,
          imagePath: req.file.location, labels: labels2}, function (err, u) { // finds and updates user in the database
          if (err) return next(err);
          res.status(200).json({message: 'Update successful!'});
      });
       /*
        if (result.n > 0) { // post indeed updated
          res.status(200).json({message: 'Update successful!'});
        } else {
          res.status(401).json({message: 'Not authorized!'});
        }
      })
      .catch(error => {
        res.status(500).json({
          message: 'Couldn\'t update post!'
        })
      })*/
    } // if
  });
});

router.get("", (req, res, next) => {
  /*  const posts = [
      {id: "kyfkfuyhj", title: "First server post", content: "Bla bla from server"},
      {id: "jkvouououg", title: "2nd server post", content: "Bla bla bla from server"},
    ];*/
  // console.log(req.query);
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;
  const postQuery = Post.find();
  let fetchedPosts;
  if (pageSize && currentPage) {
    postQuery
      .skip(pageSize * (currentPage -1))
      .limit(pageSize);
  }
  postQuery.then(documents => {
    // console.log(documents);
    fetchedPosts = documents;
    return Post.count();
  })
  .then (count => {
    res.status(200).json({
      message: "Posts fetched successfully!",
      posts: fetchedPosts,
      maxPosts: count
    });
  })
  .catch(error => {
    res.status(500).json({
      message: 'Fetching posts failed!'
    })
  })
});

router.get("/:id", (req, res, next) => {
  Post.findById(req.params.id).then(post =>{
    if (post) {
      res.status(200).json(post);
    } else {
      res.status(404).json({message: 'Post not found!'});
    }
  })
  .catch(error => {
    res.status(500).json({
      message: 'Fetching post failed!'
    })
  })
});

router.delete("/:id", checkAuth, (req, res, next) => {
  // console.log(req.params.id);
  Post.deleteOne({_id:req.params.id, creator: req.userData.userId}).then(result => {
    // console.log(result);
    if (result.n > 0) { // post indeed updated
      res.status(200).json({message: 'Deletion successful!'});
    } else {
      res.status(401).json({message: 'Not authorized!'});
    }
  })
  .catch(error => {
    res.status(500).json({
      message: 'Deleting posts failed!'
    })
  })
});

module.exports = router;
