const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

let db;

async function connectToDatabase() {
    db = await sqlite.open({
        filename: './db.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(
        `CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      points INTEGER NOT NULL,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
    )
    .catch(err => {
        console.error('Error creating scores table:', err);
    });
    console.log('✅ Database connected and scores table ensured');
    return db;
}

module.exports = {
    connectToDatabase,
    getDB: () => db,
    closeDatabase: async () => {
        if (db) {
            await db.close();
            console.log('✅ Database connection closed');
        }
    }
};