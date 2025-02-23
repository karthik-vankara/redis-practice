const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { createClient } = require('redis'); // Import createClient

const app = express();
const port = 3000;

const DEFAULT_EXPIRATION = 3600;

// Create and connect the Redis client *once*
const redisClient = createClient();

redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
    // Handle the error appropriately, e.g., retry connection, exit, etc.
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});


(async () => {
    try {
        await redisClient.connect(); // Wait for the client to connect
        console.log("Redis Connected Successfully")
    } catch (error) {
        console.error("Redis connection error:", error);
        // Handle the error, e.g., exit the application
        process.exit(1); // or other appropriate error handling
    }

    app.use(express.urlencoded({ extended: true }));
    app.use(cors());

    app.get('/photos', async (req, res) => {
        try {
            const cachedPhotos = await redisClient.get('photos');

            if (cachedPhotos) {
                console.log("Fetching from redis")
                res.json(JSON.parse(cachedPhotos));
                return; // Important: Exit early if data is cached
            }

            const response = await axios.get('https://jsonplaceholder.typicode.com/photos');
            const data = response.data;

            await redisClient.setEx('photos', DEFAULT_EXPIRATION, JSON.stringify(data)); // Use await
            res.json(data);
        } catch (error) {
            console.error("Error fetching photos:", error);
            res.status(500).json({ error: 'Failed to fetch photos' });
        }
    });

    app.get('/photos/:id', async (req, res) => {
        try {
            const cachedPhoto = await redisClient.get(`photos:${req.params.id}`);
            if(cachedPhoto){
                res.json(JSON.parse(cachedPhoto));
                return;
            }
            const { data } = await axios.get(`https://jsonplaceholder.typicode.com/photos/${req.params.id}`);
            await redisClient.setEx(`photos:${req.params.id}`, DEFAULT_EXPIRATION, JSON.stringify(data))
            res.json(data);
        } catch (error) {
            console.error("Error fetching photo by ID:", error);
            res.status(500).json({ error: 'Failed to fetch photo' }); // Handle error
        }
    });

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });
})();