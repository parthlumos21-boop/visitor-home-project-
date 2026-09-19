const { Client } = require('pg');

async function runTest() {
  const c = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/visitor_gate' });
  try {
    await c.connect();
    
    console.log('Checking existing data...');
    const countRes = await c.query('SELECT COUNT(*) FROM "User";');
    console.log(`Currently there are ${countRes.rows[0].count} users in the database.`);

    console.log('Storing new test data...');
    const insertRes = await c.query(`
      INSERT INTO "VisitorProfile" (id, name, phone, email, "createdAt") 
      VALUES (gen_random_uuid(), 'Database Setup Tester', '+1234567890', 'tester@visitorgate.com', NOW()) 
      RETURNING *;
    `);

    console.log('Successfully stored test data in VisitorProfile table!');
    console.log(insertRes.rows[0]);

  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    await c.end();
  }
}

runTest();
