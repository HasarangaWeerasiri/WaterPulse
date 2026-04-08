import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/user.js';
import SafeZone from './models/safeZone.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing users and safe zones
    await User.deleteMany({});
    await SafeZone.deleteMany({});
    console.log('Cleared existing users and safe zones');

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

    // Create test safe zones (near the user's location 6.9081, 79.9793)
    const testSafeZones = [
      {
        name: 'Ratnapura Water Well',
        type: 'Well',
        description: 'Clean water source in Ratnapura area',
        location: {
          type: 'Point',
          coordinates: [79.9793, 6.9081] // [lng, lat]
        },
        address: 'Ratnapura, Sri Lanka',
        isAvailable: true,
        createdBy: createdUsers[1]._id // authority
      },
      {
        name: 'City Tanker Station',
        type: 'Tanker',
        description: 'Water distribution tanker point',
        location: {
          type: 'Point',
          coordinates: [79.9805, 6.9090]
        },
        address: 'Main Street, Ratnapura',
        isAvailable: true,
        createdBy: createdUsers[1]._id
      },
      {
        name: 'District Filter Plant',
        type: 'Filter',
        description: 'Water filtration center',
        location: {
          type: 'Point',
          coordinates: [79.9780, 6.9070]
        },
        address: 'Industrial Area, Ratnapura',
        isAvailable: true,
        createdBy: createdUsers[4]._id // sarah - authority
      },
      {
        name: 'Community Tap Station',
        type: 'Tap',
        description: 'Public water access point',
        location: {
          type: 'Point',
          coordinates: [79.9815, 6.9095]
        },
        address: 'Market Square, Ratnapura',
        isAvailable: true,
        createdBy: createdUsers[1]._id
      },
      {
        name: 'Borehole Supply',
        type: 'Borehole',
        description: 'Deep water well system',
        location: {
          type: 'Point',
          coordinates: [79.9770, 6.9075]
        },
        address: 'Rural Zone, Ratnapura',
        isAvailable: true,
        createdBy: createdUsers[4]._id
      },
      {
        name: 'Emergency Water Point',
        type: 'Other',
        description: 'Backup water supply during emergencies',
        location: {
          type: 'Point',
          coordinates: [79.9825, 6.9100]
        },
        address: 'Emergency Center, Ratnapura',
        isAvailable: true,
        createdBy: createdUsers[1]._id
      }
    ];

    const createdZones = await SafeZone.insertMany(testSafeZones);
    console.log(`✓ Created ${createdZones.length} test safe zones`);

    console.log('\nDemo Credentials:');
    console.log('Citizen: citizen@test.com / password123');
    console.log('Authority: authority@test.com / password123');
    console.log('Admin: admin@test.com / password123');

    console.log('\nTest Safe Zones Created:');
    createdZones.forEach(zone => {
      console.log(`- ${zone.name} (${zone.type}) at [${zone.location.coordinates[0].toFixed(4)}, ${zone.location.coordinates[1].toFixed(4)}]`);
    });

    await mongoose.connection.close();
    console.log('\nDatabase seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
