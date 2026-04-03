const express = require('express');
const router = express.Router();
const {
  uploadImage,
  uploadDocument,
  uploadMultipleImages,
  deleteFile
} = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'Error uploading file'
    });
  }
  next();
};

// Single image upload
router.post('/image', protect, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, uploadImage);

// Single document upload (PDF, DOC, etc.)
router.post('/document', protect, (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, uploadDocument);

// Multiple images upload (max 10)
router.post('/images', protect, (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, uploadMultipleImages);

// Delete file
router.delete('/:publicId', protect, deleteFile);

module.exports = router;
