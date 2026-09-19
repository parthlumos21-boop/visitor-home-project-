const { Client } = require('pg');

async function fixPgAdmin() {
  const c = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/vistor_gate' });
  try {
    await c.connect();
    console.log('Connected to vistor_gate. Creating dummy postgres database...');
    await c.query(`CREATE DATABASE postgres;`);
    console.log('Successfully created empty postgres database! pgAdmin 4 should now connect instantly.');
  } catch (e) {
    console.error('Error creating database:', e.message);
  } finally {
    await c.end();
  }
}

fixPgAdmin();
