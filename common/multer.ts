// common/multer.ts
import multer from 'multer';

const storage = multer.memoryStorage(); // Store the image as a buffer in memory

const upload = multer({ storage });

export default upload;
