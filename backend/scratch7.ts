const { Client } = require('pg');
async function run() {
  const c = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/postgres' });
  await c.connect();
  await c.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'visitor_gate' AND pid != pg_backend_pid();`);
  await c.query(`ALTER DATABASE visitor_gate RENAME TO vistor_gate;`);
  console.log('Successfully renamed database back to vistor_gate');
  await c.end();
}
run().catch(console.error);
