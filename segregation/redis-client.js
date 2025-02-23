const { createClient } = require('redis');

const redisClient = createClient();

redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

// Immediately invoked async function to handle connection
(async () => {
    try {
        await redisClient.connect();
        console.log("Redis Connected Successfully");
    } catch (error) {
        console.error("Redis connection error:", error);
        process.exit(1); // Or handle appropriately
    }
})();

// Export functions for setting and getting data
module.exports = {
    get: async (key) => {
        try {
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : null;  // Parse if exists
        } catch (err) {
            console.error("Error getting from Redis:", err);
            return null; // Or throw the error if you prefer
        }
    },
    set: async (key, value, expiry = 3600) => {  // Default expiry
        try {
            await redisClient.setEx(key, expiry, JSON.stringify(value));
        } catch (err) {
            console.error("Error setting to Redis:", err);
            // Handle error as needed
        }
    },
};