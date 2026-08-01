import express, { Request, Response } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.STORAGE_PORT || 4005;

// MinIO S3 Client
const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1', // MinIO doesn't care about region but SDK requires it
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER || 'doorli_admin',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'doorli_password_123',
  },
  forcePathStyle: true, // Necessary for MinIO
});

const upload = multer({ storage: multer.memoryStorage() });

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'doorli-storage' });
});

app.post('/api/storage/upload', upload.single('file') as any, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const { originalname, buffer, mimetype } = req.file;
    const extension = originalname.split('.').pop();
    const filename = `${uuidv4()}.${extension}`;
    const bucket = 'doorli-media';

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: buffer,
      ContentType: mimetype,
    });

    await s3Client.send(command);

    const publicUrl = `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${bucket}/${filename}`;

    res.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

app.delete('/api/storage/:key', async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const bucket = 'doorli-media';

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);

    res.json({ success: true, message: `File ${key} deleted successfully` });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.get('/api/storage/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prefix } = req.query;
    const bucket = 'doorli-media';

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix as string || undefined,
    });

    const response = await s3Client.send(command);

    const files = (response.Contents || []).map((item) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
    }));

    res.json({ success: true, files, count: files.length });
  } catch (error) {
    console.error('List Error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

app.get('/api/storage/presign/:key', async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const bucket = 'doorli-media';
    const expiresIn = parseInt(req.query.expires as string) || 3600; // Default 1 hour

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    res.json({ success: true, url, expiresAt: new Date(Date.now() + expiresIn * 1000) });
  } catch (error) {
    console.error('Presign Error:', error);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

app.listen(PORT, () => {
  console.log(`Storage microservice listening on port ${PORT}`);
});
