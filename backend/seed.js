import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/user.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash('password123', salt);

    // Create dummy users
    const dummyUsers = [
      {
        firstName: 'John',
        lastName: 'Citizen',
        email: 'citizen@test.com',
        password: hashedPassword,
        role: 'citizen',
        phoneNumber: '0771234567',
        location: {
          city: 'New York',
          district: 'Manhattan'
        }
      },
      {
        firstName: 'Jane',
        lastName: 'Authority',
        email: 'authority@test.com',
        password: hashedPassword,
        role: 'authority',
        phoneNumber: '0771234568',
        location: {
          city: 'New York',
          district: 'Brooklyn'
        }
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
        phoneNumber: '0771234569',
        location: {
          city: 'New York',
          district: 'Queens'
        }
      },
      {
        firstName: 'Mike',
        lastName: 'Smith',
        email: 'mike@test.com',
        password: hashedPassword,
        role: 'citizen',
        phoneNumber: '0779876543',
        location: {
          city: 'New York',
          district: 'Manhattan'
        }
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@test.com',
        password: hashedPassword,
        role: 'authority',
        phoneNumber: '0779876544',
        location: {
          city: 'New York',
          district: 'Manhattan'
        }
      }
    ];

    const createdUsers = await User.insertMany(dummyUsers);
    console.log(`✓ Created ${createdUsers.length} dummy users`);
    console.log('\nDemo Credentials:');
    console.log('Citizen: citizen@test.com / password123');
    console.log('Authority: authority@test.com / password123');
    console.log('Admin: admin@test.com / password123');

    await mongoose.connection.close();
    console.log('\nDatabase seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
