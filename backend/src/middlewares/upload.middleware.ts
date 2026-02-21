import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';
import { AppError } from './error.middleware';
import config from '../config';

const UPLOAD_DIR = config.uploadDir;
const MAX_FILE_SIZE = config.maxFileSize;
const ALLOWED_MIMETYPES = ['application/pdf'];

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate secure random filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${uniqueSuffix}${ext}`;
    cb(null, safeName);
  },
});

// File filter
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check MIME type
  if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(new AppError(400, 'Seuls les fichiers PDF sont acceptés'));
  }

  // Check extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf') {
    return cb(new AppError(400, 'Extension de fichier invalide'));
  }

  cb(null, true);
};

// Multer instance
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// PDF signature verification
const PDF_SIGNATURE = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-

export async function verifyPdfSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.file) {
    return next();
  }

  try {
    const fd = await fs.promises.open(req.file.path, 'r');
    const buffer = Buffer.alloc(5);
    try {
      await fd.read(buffer, 0, 5, 0);
    } finally {
      await fd.close();
    }

    if (!buffer.equals(PDF_SIGNATURE)) {
      // Delete the invalid file
      await fs.promises.unlink(req.file.path);
      return next(new AppError(400, 'Le fichier n\'est pas un PDF valide'));
    }

    next();
  } catch (error) {
    // If file was uploaded, try to clean up
    if (req.file?.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch {}
    }
    next(error);
  }
}

// ============ Livre upload middleware (multi-format) ============

const LIVRE_ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/epub+zip',
  'text/plain',
  'text/html',
];

const LIVRE_ALLOWED_EXTENSIONS = new Set(['.pdf', '.epub', '.txt', '.html', '.htm']);

const livreFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (!LIVRE_ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(new AppError(400, 'Format non supporté. Formats acceptés : PDF, EPUB, TXT, HTML'));
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!LIVRE_ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new AppError(400, 'Extension de fichier invalide'));
  }

  cb(null, true);
};

export const livreUploadMiddleware = multer({
  storage,
  fileFilter: livreFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// Clean up file on error
export function cleanupOnError(filePath?: string) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      log.warn('Failed to cleanup file', { filePath, error });
    }
  }
}

export default uploadMiddleware;
