const { getDb } = require('../data/database'); // Import getDb

async function getSecondaryConditions(disabilities) {
    const db = getDb(); // Get the database connection pool

    try {
        const query = `
            SELECT medical_condition_name, secondary_conditions 
            FROM medical_conditions 
            WHERE medical_condition_name IN (?)
        `;
        const [rows] = await db.query(query, [disabilities]); // Execute the query
        return rows;
    } catch (err) {
        console.error('Error fetching secondary conditions:', err);
        throw err;
    }
}

module.exports = {
    getSecondaryConditions,
};