import { Pool } from 'pg';

// Toutes les variables sont obligatoires — aucune valeur par défaut en dur.
// En dev local : créer un fichier .env.local à la racine de kasuku-immersive.
// En Docker    : variables injectées par docker-compose.
if (!process.env.DB_PASSWORD) {
  throw new Error('DB_PASSWORD est requis (variable d\'environnement manquante)');
}

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  user:     process.env.DB_USER     || 'kasuku',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME     || 'kasuku_db',
  max: 5,
});

export default pool;
