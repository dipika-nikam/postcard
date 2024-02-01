// app.js or index.js

const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/database');
const userRoutes = require('./src/routes/userRoutes');
const path = require('path');
const multerMiddleware = require('./src/middleware/multer');
const User  = require('./src/models/userModel');

const app = express();
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));


mongoose.connect(config.url, config.options)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
app.use('/api', userRoutes);
app.use(multerMiddleware.customErrorHandler);