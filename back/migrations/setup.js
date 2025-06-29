const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'chatuser',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'chatdb',
  password: process.env.DB_PASSWORD || 'chatpassword',
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up database tables...');

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table (for future features)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_online BOOLEAN DEFAULT FALSE
      )
    `);

    // Create rooms table (for future features)
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_private BOOLEAN DEFAULT FALSE
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_username ON messages(username);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Insert some sample data
    await client.query(`
      INSERT INTO messages (username, message) 
      VALUES 
        ('System', 'Welcome to the chat room!'),
        ('Admin', 'Database setup completed successfully!')
      ON CONFLICT DO NOTHING
    `);

    console.log('Database setup completed successfully!');
    
  } catch (err) {
    console.error('Error setting up database:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { setupDatabase };