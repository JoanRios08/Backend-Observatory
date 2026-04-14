import { pool } from '../db.js';

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}***@${domain}`;
};

const getPasswordInfo = (user) => {
  const passwordColumn = ['password', 'password_hash', 'pass'].find(column => user[column]);
  if (!passwordColumn) return { passwordColumn: null, passwordKind: 'missing' };

  const value = String(user[passwordColumn]).trim();
  return {
    passwordColumn,
    passwordKind: value.startsWith('$2') ? 'bcrypt' : 'plain_text_or_unknown',
    passwordLength: value.length,
  };
};

async function run() {
  const email = process.argv[2];

  try {
    if (email) {
      const result = await pool.query('SELECT * FROM public."User" WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
      const user = result.rows[0];

      if (!user) {
        console.log('User not found for email:', maskEmail(email));
        return;
      }

      const { password, password_hash, pass, ...safeUser } = user;
      console.log({
        found: true,
        user: {
          id: safeUser.id,
          email: maskEmail(safeUser.email),
          name: safeUser.name,
          first_name: safeUser.first_name,
          role_id: safeUser.role_id,
          status: safeUser.status,
          created_at: safeUser.created_at,
          updated_at: safeUser.updated_at,
        },
        ...getPasswordInfo(user),
      });
      return;
    }

    const result = await pool.query('SELECT id, email, status FROM public."User" ORDER BY id DESC LIMIT 20');
    console.log('Found', result.rows.length, 'users');
    console.log(result.rows.map(user => ({ ...user, email: maskEmail(user.email) })));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
