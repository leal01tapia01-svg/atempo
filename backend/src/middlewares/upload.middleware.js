import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

function makeUploadSingle(fieldName, subfolder) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(__dirname, '..', '..', 'uploads', subfolder);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = crypto.randomUUID();
      cb(null, `${name}${ext}`);
    }
  });

  const fileFilter = (_req, file, cb) => {
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Formato de imagen no permitido'), false);
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
  }).single(fieldName);
}

export const uploadLogo = makeUploadSingle('logo', 'logos');
export const uploadEmpleadoFoto = makeUploadSingle('foto', 'empleados');
