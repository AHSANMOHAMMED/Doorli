import express from 'express';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_doorli_2026';

// Store OTP temporarily
app.post('/auth/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store in Redis with 5 minutes TTL
  await redis.set(`otp:${phone}`, otp, 'EX', 300);

  // In production, trigger SMS gateway here
  console.log(`Sending OTP ${otp} to ${phone}`);

  res.json({ success: true, message: 'OTP sent successfully' });
});

app.post('/auth/verify-otp', async (req, res) => {
  const { phone, otp, role = 'customer' } = req.body;

  const storedOtp = await redis.get(`otp:${phone}`);

  if (!storedOtp || storedOtp !== otp) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  // Clear OTP
  await redis.del(`otp:${phone}`);

  // Create JWT Token
  const token = jwt.sign({ phone, role }, JWT_SECRET, { expiresIn: '7d' });

  res.json({ success: true, token, role });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
