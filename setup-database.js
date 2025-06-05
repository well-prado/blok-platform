const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Setting up Blok Platform Database...\n');

  // Database configuration
  const config = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres' // Connect to default database first
  };

  const targetDatabase = process.env.DB_NAME || 'blok_platform';

  try {
    // Connect to PostgreSQL
    console.log('📡 Connecting to PostgreSQL...');
    const client = new Client(config);
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create database if it doesn't exist
    console.log(`📊 Creating database: ${targetDatabase}`);
    try {
      await client.query(`CREATE DATABASE ${targetDatabase}`);
      console.log(`✅ Database ${targetDatabase} created`);
    } catch (error) {
      if (error.code === '42P04') { // Database already exists
        console.log(`ℹ️  Database ${targetDatabase} already exists`);
      } else {
        throw error;
      }
    }

    await client.end();

    // Connect to the target database
    console.log(`📡 Connecting to ${targetDatabase}...`);
    const targetClient = new Client({
      ...config,
      database: targetDatabase
    });
    await targetClient.connect();
    console.log(`✅ Connected to ${targetDatabase}`);

    // Run migration scripts
    console.log('📋 Running database migrations...');
    const migrationPath = path.join(__dirname, 'database', 'migrations', '001_create_users_table.sql');
    
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await targetClient.query(migrationSQL);
      console.log('✅ Users table migration completed');
    } else {
      console.log('⚠️  Migration file not found, creating users table manually...');
      
      // Create users table manually
      const createUsersSQL = `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          bio TEXT,
          profile_image_url TEXT,
          is_verified BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `;
      
      await targetClient.query(createUsersSQL);
      console.log('✅ Users table created manually');
    }

    // Verify table creation
    const result = await targetClient.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Users table structure:');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type}`);
    });

    await targetClient.end();
    console.log('\n🎉 Database setup completed successfully!');
    
    console.log('\n📝 Next steps:');
    console.log('1. Set environment variables (copy from the suggestions below):');
    console.log('   DB_HOST=localhost');
    console.log('   DB_PORT=5432');
    console.log(`   DB_NAME=${targetDatabase}`);
    console.log(`   DB_USER=${config.user}`);
    console.log(`   DB_PASSWORD=${config.password}`);
    console.log('   JWT_SECRET=your-super-secret-jwt-key-change-in-production');
    console.log('   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production');
    console.log('\n2. Start the server: pnpm dev');
    console.log('3. Run tests: node tests/auth.test.js');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check database credentials');
    console.error('3. Ensure the user has create database permissions');
    process.exit(1);
  }
}

// Run setup
setupDatabase(); 