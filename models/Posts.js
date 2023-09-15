const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: String,
    caption: String,
    description: String,
    image: String,
    userId: String
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
