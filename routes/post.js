const express = require('express');
const jwt = require('jsonwebtoken');
const Post = require('../models/Posts');
const router = express.Router();
const dotenv = require('dotenv');
const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
dotenv.config();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const upload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024, // size < 5 MB
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype) {
            return cb(null, true);
        } else {
            cb("Error: File upload only supports the following filetypes - " + filetypes);
        }
    }
});

const authenticate = (req, res, next) => {
    try {
        console.log(req.header);
        const authHeader = req.header('Authorization');
        if (!authHeader) return res.status(401).send('Unauthorized');

        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).send('Unauthorized');

        jwt.verify(token, process.env.FB_SECRET_KEY, (err, user) => {
            if (err) return res.status(401).send('Unauthorized');
            req.user = user;
            next();
        });
    } catch (error) {
        return res.status(500).send('Internal Server Error');
    }
};

router.post('/', upload.single('file'), authenticate, async (req, res) => {
    try {
        const { title, caption, description } = req.body;
        const { buffer, mimetype } = req.file;
        const extension = mimetype.split('/')[1];
        const key = `${uuidv4()}.${extension}`;
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: buffer,
            'Content-Type': `images/${extension}`
        };
        await s3.upload(params).promise();
        const url = s3.getSignedUrl('getObject', {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        });
        const post = new Post({
            title,
            caption,
            description,
            image: url,
            userId: req.user.id,
        });
        await post.save();
        res.json({
            message: 'Post created'
        });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

router.get('/', authenticate, async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.user.id });
        res.json(posts);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;
