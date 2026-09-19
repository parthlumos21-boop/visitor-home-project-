const { Client } = require('pg'); 
async function check() { 
  const c1 = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/postgres' }); 
  await c1.connect(); 
  const res1 = await c1.query('SELECT name, email, role FROM "User" LIMIT 5;'); 
  console.log('postgres DB Users:', res1.rows); 
  await c1.end(); 
  
  const c2 = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/vistor_gate' }); 
  await c2.connect(); 
  const res2 = await c2.query('SELECT name, email, role FROM "User" LIMIT 5;'); 
  console.log('vistor_gate DB Users:', res2.rows); 
  await c2.end(); 
} 
check().catch(console.error);
