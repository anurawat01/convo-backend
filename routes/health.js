const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
    res.json('API is running!');
})

module.exports = router;