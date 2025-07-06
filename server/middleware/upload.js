import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = "uploads";
const subdirs = ["plants", "gardens", "users", "community"];

subdirs.forEach((subdir) => {
  const dir = path.join(uploadDir, subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = uploadDir;

    // Determine upload path based on route
    if (req.baseUrl.includes("/plants")) {
      uploadPath = path.join(uploadDir, "plants");
    } else if (req.baseUrl.includes("/gardens")) {
      uploadPath = path.join(uploadDir, "gardens");
    } else if (req.baseUrl.includes("/users")) {
      uploadPath = path.join(uploadDir, "users");
    } else if (req.baseUrl.includes("/community")) {
      uploadPath = path.join(uploadDir, "community");
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);

    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Maximum 10 files
  },
  fileFilter: fileFilter,
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum size is 5MB.",
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          message: "Too many files. Maximum is 10 files.",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          message: "Unexpected field name for file upload.",
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`,
        });
    }
  }

  if (
    error.message === "Only image files are allowed (jpeg, jpg, png, gif, webp)"
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};

// Helper function to delete files
const deleteFile = (filePath) => {
  return new Promise((resolve) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      }
      resolve();
    });
  });
};

// Helper function to delete multiple files
const deleteFiles = async (filePaths) => {
  const deletePromises = filePaths.map((filePath) => deleteFile(filePath));
  await Promise.all(deletePromises);
};

export { upload, handleMulterError, deleteFile, deleteFiles };
