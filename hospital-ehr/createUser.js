require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const getArgValue = (flag) => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? '' : (process.argv[index + 1] || '');
};

async function createUser() {
  const name = getArgValue('--name');
  const email = getArgValue('--email').toLowerCase();
  const password = getArgValue('--password');
  const role = getArgValue('--role');

  if (!name || !email || !password || !['patient', 'doctor', 'admin'].includes(role)) {
    console.error('Usage: node createUser.js --name "Name" --email "user@example.com" --password "StrongPassword123!" --role patient|doctor|admin');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  if (role === 'admin') {
    const existingAdmin = await User.exists({ role: 'admin' });
    if (existingAdmin) {
      console.error('Admin account already exists. Use the Admin portal to sign in.');
      process.exit(1);
    }
  }

  const exists = await User.findOne({ email });
  if (exists) {
    console.log(`${role} already exists`);
    process.exit(0);
  }

  const user = new User({ name, email, password, role });
  await user.save();
  console.log(`${role} created: ${user.email}`);

  process.exit(0);
}

createUser().catch((error) => {
  console.error('Failed to create user', error);
  process.exit(1);
});