import { Pool } from 'pg';

// Pool lazy-init : la vérification de DB_PASSWORD se fait à la première requête
// (runtime), pas à l'import (build time), pour éviter les échecs de build Docker.
// En dev local : créer un fichier .env.local à la racine de kasuku-immersive.
// En Docker    : variables injectées par docker-compose.

let _pool: Pool | null = null;

const getPool = (): Pool => {
  if (!_pool) {
    if (!process.env.DB_PASSWORD) {
      throw new Error("DB_PASSWORD est requis (variable d'environnement manquante)");
    }
    _pool = new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      user:     process.env.DB_USER     || 'kasuku',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME     || 'kasuku_db',
      max: 5,
    });
  }
  return _pool;
};

// Proxy qui délègue tous les accès au Pool réel (initialisé paresseusement)
// Maintient l'interface Pool complète sans changer les fichiers consommateurs.
const pool = new Proxy({} as Pool, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(_target, prop) { return (getPool() as any)[prop]; },
});

export default pool;
