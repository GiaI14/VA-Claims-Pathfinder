const { getDb } = require('./data/database');

async function testDatabase() {
    const db = getDb();
    console.log('Database connection pool:', db); // Debugging log

    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        console.log('Query results:', rows); // Debugging log
    } catch (err) {
        console.error('Database connection test failed:', err);
    }
}

testDatabase();