const { Client } = require('pg');
async function check() {
  const c1 = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/postgres' });
  await c1.connect();
  const res1 = await c1.query("SELECT datname FROM pg_database;");
  console.log('Databases:', res1.rows.map(r => r.datname));
  await c1.end();
}
check().catch(console.error);
