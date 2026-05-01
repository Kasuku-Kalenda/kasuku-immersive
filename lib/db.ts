import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'kasuku',
  password: 'RGKdSpTCHqEYsKB33ROlO0hhZec0CIx',
  database: 'kasuku_db',
  max: 5,
});

export default pool;
