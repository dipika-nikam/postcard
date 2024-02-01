// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const user = require('../controllers/userController');
const upload = require('../middleware/multer');
const verifyToken = require('../middleware/authMiddleware')

router.post('/login', user.loginUser);

router.use(verifyToken);
router.post('/postcard', upload.single('background_image'), user.createPostcard);
router.get('/get/postcard', user.GetallPostcard);
router.get('/get/:counter', user.GetallPostcardlink);
router.get('/get/link/:id', user.updatePostcardLink)
module.exports = router;
