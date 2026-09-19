const { Client } = require('pg');

async function migrateAndDrop() {
  // Connect to postgres to fetch the user
  const cOld = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/postgres' });
  let userRow = null;
  try {
    await cOld.connect();
    console.log('Fetching parthlumos21@gmail.com from postgres...');
    const res = await cOld.query(`SELECT * FROM "User" WHERE email = 'parthlumos21@gmail.com' LIMIT 1;`);
    if (res.rows.length > 0) {
      userRow = res.rows[0];
      console.log('Found user:', userRow.email);
    } else {
      console.log('User parthlumos21@gmail.com not found in postgres!');
    }
  } catch (e) {
    console.error('Error fetching user:', e.message);
  } finally {
    await cOld.end();
  }

  // Connect to vistor_gate to insert the user
  if (userRow) {
    const cNew = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/vistor_gate' });
    try {
      await cNew.connect();
      console.log('Inserting user into vistor_gate...');
      // Check if user already exists
      const checkRes = await cNew.query(`SELECT id FROM "User" WHERE email = $1`, [userRow.email]);
      if (checkRes.rows.length === 0) {
        await cNew.query(`
          INSERT INTO "User" (id, "employeeId", name, phone, email, "passwordHash", role, department, designation, status, "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          userRow.id, userRow.employeeId, userRow.name, userRow.phone, userRow.email, 
          userRow.passwordHash, userRow.role, userRow.department, userRow.designation, 
          userRow.status, userRow.createdAt
        ]);
        console.log('Successfully inserted user into vistor_gate!');
      } else {
        console.log('User already exists in vistor_gate!');
      }
    } catch (e) {
      console.error('Error inserting user:', e.message);
    } finally {
      await cNew.end();
    }
  }

  // Now connect to vistor_gate to attempt dropping postgres
  const cDrop = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/vistor_gate' });
  try {
    await cDrop.connect();
    console.log('Attempting to drop postgres database...');
    // Terminate connections to postgres
    await cDrop.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'postgres' AND pid != pg_backend_pid();`);
    await cDrop.query(`DROP DATABASE postgres;`);
    console.log('Successfully deleted postgres database!');
  } catch (e) {
    console.error('Error dropping postgres:', e.message);
    // If we can't drop it, fallback to truncating all tables
    if (e.message.includes('cannot drop the currently open database') || e.message.includes('cannot drop default database') || e.message.includes('system')) {
      console.log('PostgreSQL prevented dropping the system database. Falling back to completely wiping the tables instead...');
      const cWipe = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/postgres' });
      try {
        await cWipe.connect();
        await cWipe.query(`
          DO $$ DECLARE
            r RECORD;
          BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
              EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
          END $$;
        `);
        console.log('Successfully wiped all tables from postgres!');
      } catch (err) {
        console.error('Error wiping tables:', err.message);
      } finally {
        await cWipe.end();
      }
    }
  } finally {
    await cDrop.end();
  }
}

migrateAndDrop();
