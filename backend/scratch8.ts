const { Client } = require('pg');
async function check() {
  const c = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/vistor_gate' });
  await c.connect();
  const res = await c.query('SELECT * FROM "NewAppointment" ORDER BY "createdAt" DESC LIMIT 5;');
  console.log('Recent Appointments:', res.rows);
  await c.end();
}
check().catch(console.error);
