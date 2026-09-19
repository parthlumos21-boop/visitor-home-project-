const { Client } = require('pg');
async function run() {
  const c = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/postgres' });
  await c.connect();
  await c.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'vistor_gate' AND pid != pg_backend_pid();`);
  await c.query(`ALTER DATABASE vistor_gate RENAME TO visitor_gate;`);
  console.log('Successfully renamed database to visitor_gate');
  await c.end();
}
run().catch(console.error);
