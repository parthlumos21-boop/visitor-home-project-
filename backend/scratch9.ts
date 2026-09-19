const { Client } = require('pg');
async function checkLogs() {
  const c = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/vistor_gate' });
  await c.connect();
  const res = await c.query('SELECT "createdAt", method, url, status, message, "userEmail" FROM "ActivityLog" ORDER BY "createdAt" DESC LIMIT 15;');
  console.table(res.rows);
  await c.end();
}
checkLogs().catch(console.error);
