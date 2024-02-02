// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const user = require('../controllers/userController');
const upload = require('../middleware/multer');
const verifyToken = require('../middleware/authMiddleware')

router.post('/login', user.loginUser);

router.use(verifyToken);
router.post('/add-postcard', upload.single('background_image'), user.createPostcard);
router.get('/all/postcard', user.GetallPostcard);
router.get('/link/:counter', user.GetallPostcardlink);
router.put('/link/:id', user.updatePostcardLink)
module.exports = router;
