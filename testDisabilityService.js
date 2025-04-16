const { connectToDatabase, getDb } = require('./data/database'); // Import connectToDatabase and getDb

async function testDatabase() {
    try {
        await connectToDatabase(); // Connect to the database first
        const db = getDb(); // Now get the database connection pool
        console.log('Database connection pool:', db); // Debugging log

        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        console.log('Query results:', rows); // Debugging log
    } catch (err) {
        console.error('Database connection test failed:', err);
    }
}

testDatabase();