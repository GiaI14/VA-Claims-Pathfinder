const mysql = require('mysql2/promise');

let pool;

async function connectToDatabase() {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log('Connected to MySQL database successfully');
    } catch (error) {
        console.error('Error connecting to MySQL:', error);
        throw error;
    }
}

function getDb() {
    if (!pool) {
        console.error('Connection pool is not initialized'); // Debugging log
        throw new Error('You must connect first!');
    }
    return pool;
}

module.exports = {
    connectToDatabase,
    getDb,
};