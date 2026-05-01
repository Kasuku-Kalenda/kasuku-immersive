import { Pool } from 'pg';

// En dev local : variables hardcodées (fallback)
// En Docker    : variables d'env injectées par docker-compose
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  user:     process.env.DB_USER     || 'kasuku',
  password: process.env.DB_PASSWORD || 'RGKdSpTCHqEYsKB33ROlO0hhZec0CIx',
  database: process.env.DB_NAME     || 'kasuku_db',
  max: 5,
});

export default pool;
