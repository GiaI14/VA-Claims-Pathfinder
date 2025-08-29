const { connectToDatabase, getDb } = require('./data/database');

async function testDatabase() {
    try {
        await connectToDatabase(); // Make sure pool is initialized
        const db = getDb();
        console.log('Database connection pool:', db); // Debugging log

        const [rows] = await db.query('SELECT DATABASE() AS db, NOW() AS now, 1 + 1 AS solution');
        console.log('Query results:', rows); // Should show current DB name, time, and solution=2
    } catch (err) {
        console.error('Database connection test failed:', err);
    }
}

testDatabase();
