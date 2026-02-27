require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
});

const migrations = fs
  .readdirSync(path.join(__dirname, 'migrations'))
  .filter((f) => f.endsWith('.js'))
  .sort();

(async () => {
  const queryInterface = sequelize.getQueryInterface();

  // Create migrations tracking table if it doesn't exist
  await queryInterface.createTable('_migrations', {
    name: { type: Sequelize.STRING, primaryKey: true },
    run_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  }).catch(() => {}); // ignore if already exists

  const [ran] = await sequelize.query('SELECT name FROM _migrations');
  const ranNames = new Set(ran.map((r) => r.name));

  for (const file of migrations) {
    if (ranNames.has(file)) {
      console.log(`[skip] ${file}`);
      continue;
    }

    console.log(`[run]  ${file}`);
    const migration = require(path.join(__dirname, 'migrations', file));
    await migration.up(queryInterface, Sequelize);
    await sequelize.query('INSERT INTO _migrations (name, run_at) VALUES (:name, NOW())', {
      replacements: { name: file },
    });
    console.log(`[done] ${file}`);
  }

  console.log('All migrations complete.');
  await sequelize.close();
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
