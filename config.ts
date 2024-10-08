import dotenv from 'dotenv';
dotenv.config();

interface Config {
  appUrl: string;
  port: number;
  mongoURI: string;
  jwtSecret: string;
  stripeSecretKey: string;
  minioEndpoint: string;
  minioPort: number;
  minioUseSSL: boolean;
  minioAccessKey: string;
  minioSecretKey: string;
  minioBucket: string;
  emailHost: string;
  emailPort: number;
  emailUsername: string;
  emailPassword: string;
}

const config: Config = {
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  mongoURI: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  minioEndpoint: process.env.MINIO_ENDPOINT || '',
  minioPort: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT, 10) : 9000,
  minioUseSSL: process.env.MINIO_USE_SSL === 'true',
  minioAccessKey: process.env.MINIO_ACCESS_KEY || '',
  minioSecretKey: process.env.MINIO_SECRET_KEY || '',
  minioBucket: process.env.MINIO_BUCKET_NAME || '',
  emailHost: process.env.EMAIL_HOST || '',
  emailPort: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587, // or 465 for SSL
  emailUsername: process.env.EMAIL_USERNAME || '',
  emailPassword: process.env.EMAIL_PASSWORD || '',
};

export default config;