const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  imagePath: {type: String, required: true},
  creator: {type: mongoose.Schema.Types.ObjectID, ref: "User", required: true},
  labels: [{name: {type:String}, confidence: {type: Number}}]
});

module.exports = mongoose.model('Post', postSchema);

