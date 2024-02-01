// userSeeder.js

const bcrypt = require('bcrypt');
const mongoose = require('mongoose'); 
const { User } = require('./src/models/userModel'); 

const seedUsers = async () => {
  try {
    const usersData = [
      {
        username: 'new user2',
        email: 'new8.infynno@gmail.com',
        password: 'new@123',
      },
      {
        username: 'dipika',
        email: 'dipika.infynno@gmail.com',
        password: 'Dipika@123',
      },
    ];

    await mongoose.connect('mongodb+srv://dipikainfynno:FL6wIn87lN5pXTVr@cluster0.og2h1ju.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    for (const userData of usersData) {
      const existingUser = await User.findOne({ email: userData.email });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const newUser = new User({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
        });
        await newUser.save();
        console.log(`User with email '${userData.email}' seeded successfully.`);
      } else {
        console.log(`User with email '${userData.email}' already exists, skipping.`);
      }
    }

    console.log('Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedUsers();
