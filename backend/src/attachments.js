import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { ApiError } from './validation.js';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.doc', '.docx', '.txt', '.mp3', '.wav'
]);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp3',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.bin';
    cb(null, `RS-ATT-${randomUUID()}${safeExt}`);
  },
});

export const attachmentUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new ApiError(400, 'UNSUPPORTED_FILE_TYPE', 'Allowed file types: PDF, Images, Word documents, Plain text, and Audio.'));
    }
    cb(null, true);
  },
});

export async function listAttachments(db, reference) {
  return db.collection('attachments')
    .find({ reference }, {
      projection: { _id: 1, reference: 1, originalName: 1, mimeType: 1, size: 1, label: 1, uploadedBy: 1, createdAt: 1 }
    })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function saveAttachment(db, { reference, file, role, email, label = 'Document' }) {
  const document = {
    _id: randomUUID(),
    reference,
    originalName: file.originalname,
    fileName: file.filename,
    mimeType: file.mimetype || 'application/octet-stream',
    size: file.size,
    label: (label || 'Document').trim().slice(0, 50),
    uploadedBy: {
      role, // 'team' | 'customer'
      email,
    },
    createdAt: new Date(),
  };

  await db.collection('attachments').insertOne(document);
  const { fileName: _, ...publicDoc } = document;
  return publicDoc;
}

export async function getAttachment(db, reference, id) {
  return db.collection('attachments').findOne({ _id: id, reference });
}

export async function deleteAttachment(db, reference, id) {
  const record = await db.collection('attachments').findOne({ _id: id, reference });
  if (!record) return null;

  const filePath = join(uploadDir, record.fileName);
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Failed to unlink attachment file:', err);
  }

  await db.collection('attachments').deleteOne({ _id: id, reference });
  return record;
}

export function resolveAttachmentPath(fileName) {
  return join(uploadDir, fileName);
}
