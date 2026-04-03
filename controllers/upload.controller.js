const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if cloudinary is configured
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'portfolio',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      });

      // Delete local file after upload
      fs.unlinkSync(req.file.path);

      return res.status(200).json({
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          size: result.bytes
        }
      });
    } else {
      // Use local storage
      const fileUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
      
      return res.status(200).json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          format: path.extname(req.file.originalname).slice(1),
          size: req.file.size
        }
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
};

// @desc    Upload PDF/document
// @route   POST /api/upload/document
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if cloudinary is configured
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'portfolio/documents',
        resource_type: 'raw'
      });

      // Delete local file after upload
      fs.unlinkSync(req.file.path);

      return res.status(200).json({
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          format: path.extname(req.file.originalname).slice(1),
          size: result.bytes,
          originalName: req.file.originalname
        }
      });
    } else {
      // Use local storage
      const fileUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
      
      return res.status(200).json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          format: path.extname(req.file.originalname).slice(1),
          size: req.file.size,
          originalName: req.file.originalname
        }
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading document'
    });
  }
};

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private
exports.uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'portfolio',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' }
          ]
        });

        // Delete local file after upload
        fs.unlinkSync(file.path);

        uploadedFiles.push({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          size: result.bytes
        });
      } else {
        // Use local storage
        const fileUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
        
        uploadedFiles.push({
          url: fileUrl,
          filename: file.filename,
          format: path.extname(file.originalname).slice(1),
          size: file.size
        });
      }
    }

    res.status(200).json({
      success: true,
      count: uploadedFiles.length,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading files'
    });
  }
};

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:publicId
// @access  Private
exports.deleteFile = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (process.env.CLOUDINARY_CLOUD_NAME && publicId.includes('/')) {
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(publicId);
    } else {
      // Delete from local storage
      const filePath = path.join(uploadsDir, publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
};
