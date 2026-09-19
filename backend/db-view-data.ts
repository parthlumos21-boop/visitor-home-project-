const { Client } = require('pg');

async function viewMyData() {
  const c = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/visitor_gate' });
  try {
    await c.connect();
    
    console.log('--- YOUR NEWEST APPOINTMENT FORMS ---');
    const apts = await c.query('SELECT "fullName", "mobile", "personToMeet", "visitDate", "status", "createdAt" FROM "NewAppointment" ORDER BY "createdAt" DESC LIMIT 3;');
    if (apts.rows.length === 0) {
      console.log('No appointments found yet. (If you just filled one, ensure it successfully submitted on the app!)');
    } else {
      console.table(apts.rows);
    }

    console.log('\n--- YOUR NEWEST VISITOR PROFILES ---');
    const visitors = await c.query('SELECT name, phone, email, "createdAt" FROM "VisitorProfile" ORDER BY "createdAt" DESC LIMIT 3;');
    if (visitors.rows.length === 0) {
      console.log('No visitors found yet.');
    } else {
      console.table(visitors.rows);
    }

  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    await c.end();
  }
}

viewMyData();
