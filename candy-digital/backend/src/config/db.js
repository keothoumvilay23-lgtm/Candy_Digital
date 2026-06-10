const mysql = require('mysql2/promise');

// Bật SSL khi dùng DB cloud yêu cầu (vd Aiven, PlanetScale): đặt DB_SSL=true.
// Mặc định tắt để chạy local bình thường.
const useSsl = ['1', 'true', 'require'].includes(
  String(process.env.DB_SSL || '').toLowerCase()
);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'candy_digital',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
  });

module.exports = pool;
