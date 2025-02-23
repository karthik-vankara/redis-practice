const express = require('express');
const axios = require('axios');
const cors = require('cors');
const redis = require('./redis-client'); // Import the Redis functions

const app = express();
const port = 3000;

const DEFAULT_EXPIRATION = 3600;

app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/photos', async (req, res) => {
    try {
        const cachedPhotos = await redis.get('photos'); // Use the Redis get function
        if (cachedPhotos) {
            console.log("Fetching from redis");
            res.json(cachedPhotos);
            return;
        }
        const response = await axios.get('https://jsonplaceholder.typicode.com/photos');
        const data = response.data;

        await redis.set('photos', data, DEFAULT_EXPIRATION); // Use the Redis set function
        res.json(data);
    } catch (error) {
        console.error("Error fetching photos:", error);
        res.status(500).json({ error: 'Failed to fetch photos' });
    }
});

app.get('/photos/:id', async (req, res) => {
    try {
        const cachedPhoto = await redis.get(`photos:${req.params.id}`);
        if (cachedPhoto) {
            res.json(cachedPhoto);
            return;
        }
        const { data } = await axios.get(`https://jsonplaceholder.typicode.com/photos/${req.params.id}`);
        await redis.set(`photos:${req.params.id}`, data, DEFAULT_EXPIRATION);
        res.json(data);
    } catch (error) {
        console.error("Error fetching photo by ID:", error);
        res.status(500).json({ error: 'Failed to fetch photo' });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});