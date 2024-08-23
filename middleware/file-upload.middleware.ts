// import multer from "multer";
// import path from "path";
// import Minio from "minio";
// import config from "../config";
// import fs, {ReadStream} from "fs";
//
// // Define upload directory
// const uploadDir = path.join(__dirname, "..", "uploads");
//
// // Ensure upload directory exists
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }
//
// const MINIO_BUCKET_NAME = config.minioBucket || process.env.MINIO_BUCKET_NAME;
//
// if (!MINIO_BUCKET_NAME) {
//   throw new Error("MINIO_BUCKET_NAME environment variable is not set");
// }
//
// // Configure MinIO client
// const minioClient: Minio.Client = new Minio.Client({
//   endPoint: config.minioEndpoint || process.env.MINIO_ENDPOINT || 'localhost',
//   useSSL: config.minioUseSSL,
//   accessKey: config.minioAccessKey || process.env.MINIO_ACCESS_KEY || 'not set',
//   secretKey: config.minioSecretKey || process.env.MINIO_SECRET_KEY || 'not set',
// });
//
// // Ensure the bucket exists (or create it if it doesn't)
// async function ensureBucketExists() {
//   try {
//     await minioClient.bucketExists(config.minioBucket || process.env.MINIO_BUCKET_NAME || 'not set');
//   } catch (err : any) {
//     if (err.code === 'NoSuchBucket') {
//       await minioClient.makeBucket(config.minioBucket || process.env.MINIO_BUCKET_NAME || 'not set', '');
//     } else {
//       throw err; // Rethrow other errors
//     }
//   }
// }
//
// // Configure storage
// const storage = multer.diskStorage({
//   destination: function (req, file, cb: (error: Error | null, destination: string) => void) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//   }
// });
//
// // Configure Multer
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB file size limit
//   },
//
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
//       cb(null, true); // Accept the file
//     } else {
//       cb(new Error('Invalid file type. Only PDF and images are allowed.')); // Reject the file with an Error object
//       cb(null, false)
//     }
//   }
// });
//
// module.exports = upload;
