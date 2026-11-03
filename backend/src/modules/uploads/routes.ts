import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { UploadsController } from './controller';
import { UploadsService } from './service';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UploadsService.getUploadDir());
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Faqat PNG yoki JPG formatdagi rasmlar ruxsat etiladi'));
    }
  }
});

router.post('/', authMiddleware, upload.single('file'), UploadsController.uploadFile);

export default router;

