import User from "../models/user.model";
import KYCVerification, {IKYCVerification} from "../models/kyc-verification.model";
import Minio from "minio";
import config from "../config";
import fs, { ReadStream} from "fs";
import path from "path";
import NotificationService from "./notification.service";
import logger from "../utils/logger";

// // file interface for type safety
// interface UploadedFile {
//   originalname: string;
//   buffer?: Buffer; // Optional if you might handle files from disk
//   path?: string; // Optional if you might handle files from memory
// }
//
// let minioClient: Minio.Client | null = null;
// let MINIO_BUCKET_NAME = '';
//
// try {
//   minioClient = new Minio.Client({
//     endPoint: config.minioEndpoint,
//     useSSL: config.minioUseSSL,
//     accessKey: config.minioAccessKey,
//     secretKey: config.minioSecretKey,
//   });
//
//   MINIO_BUCKET_NAME = config.minioBucket;
//
//   if (!MINIO_BUCKET_NAME) {
//     throw new Error("MINIO_BUCKET_NAME is not set in the configuration");
//   }
// } catch (error) {
//   logger.error("Error initializing MinIO client:", error);
// }





// Auto-approve KYC setting
const AUTO_APPROVE_KYC = process.env.AUTO_APPROVE_KYC === "true";

class KYCService {
  static async initiateKYC(userId : string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    let kycVerification = await KYCVerification.findOne({ user: userId });
    if (kycVerification) {
      throw new Error("KYC verification already initiated");
    }

    kycVerification = new KYCVerification({
      user: userId,
      status: AUTO_APPROVE_KYC ? "approved" : "pending",
    });

    if (AUTO_APPROVE_KYC) {
      kycVerification.approvedAt = Date.now();
    }

    await kycVerification.save();

    // Notify user about KYC initiation or auto-approval
    //await NotificationService.notifyKYCUpdate(userId, kycVerification.status);

    logger.info(`KYC initiated for user ${userId}. Auto-approve: ${AUTO_APPROVE_KYC}`);

    return kycVerification;
  }

//   static async uploadDocument(userId : string, documentType : string, file : UploadedFile) {
//     let kycVerification = await KYCVerification.findOne({ user: userId });
//     if (!kycVerification) {
//       // Auto-initiate KYC if not already initiated
//       kycVerification = await this.initiateKYC(userId);
//     }
//
//     if (AUTO_APPROVE_KYC) {
//       logger.info(`Document upload skipped for user ${userId} due to auto-approval`);
//       return kycVerification;
//     }
//
//     if (kycVerification.status !== "pending") {
//       throw new Error("KYC verification is not in pending state");
//     }
//
//     const fileName = `${userId}_${documentType}_${Date.now()}${path.extname(file.originalname)}`;
//
//     try {
//       let fileStream;
//       let fileSize;
//
//       if (file.buffer) {
//         fileStream = Buffer.from(file.buffer);
//         fileSize = file.buffer.length;
//       } else if (file.path) {
//         fileStream = fs.createReadStream(file.path);
//         const stats = fs.statSync(file.path);
//         fileSize = stats.size;
//       } else {
//         throw new Error("Invalid file object");
//       }
//
//       let fileUrl = ''; // Initialize fileUrl
//
//       if (minioClient) { // Check if minioClient is available
//         try {
//           // Attempt MinIO upload
//           await minioClient.putObject(MINIO_BUCKET_NAME, fileName, fileStream, fileSize);
//           fileUrl = await minioClient.presignedGetObject(MINIO_BUCKET_NAME, fileName, 24 * 60 * 60);
//           logger.info(`Document uploaded to MinIO for user ${userId}`);
//         } catch (minioError) {
//           // Handle MinIO errors gracefully
//           logger.warn("Error uploading to MinIO, falling back to local storage:", minioError);
//         }
//       }
//
// // Fallback to local storage if MinIO is unavailable or upload failed
//       if (!fileUrl) {
//         fileUrl = `/uploads/${fileName}`; // Assuming you serve uploads from '/uploads'
//       }
//
//       kycVerification.documents.push({
//         type: documentType,
//         url: fileUrl, // Use the appropriate fileUrl
//       });
//
//       await kycVerification.save();
//
//       if (fileStream instanceof ReadStream) {
//         fileStream.close();
//       }
//
//       if (file.path) {
//         fs.unlinkSync(file.path);
//       }
//
//       logger.info(`Document uploaded successfully for user ${userId}`);
//       return kycVerification;
//     } catch (error) {
//       logger.error("Error uploading document:", error);
//       throw new Error("Failed to upload document: " + error);
//     }
//   }

  static async updateKYCStatus(userId : string, newStatus : string, rejectionReason = null) {
    if (AUTO_APPROVE_KYC) {
      logger.info(`KYC status update skipped for user ${userId} due to auto-approval`);
      return { status: "approved" };
    }

    const kycVerification = await KYCVerification.findOne({ user: userId });
    if (!kycVerification) {
      throw new Error("KYC verification not found");
    }

    kycVerification.status = newStatus;
    if (newStatus === "approved") {
      kycVerification.approvedAt = Date.now();
    } else if (newStatus === "rejected") {
      kycVerification.rejectionReason = rejectionReason;
    }

    await kycVerification.save();

    // Notify user about KYC status update
    await NotificationService.notifyKYCUpdate(userId, newStatus, rejectionReason);

    return kycVerification;
  }

  static async getKYCStatus(userId : string) {
    const kycVerification = await KYCVerification.findOne({ user: userId });
    if (!kycVerification) {
      throw new Error("KYC verification not found");
    }

    return {
      status: kycVerification.status,
      documents: kycVerification.documents.map((doc : IKYCVerification) => ({
        type: doc.type,
        uploadedAt: doc.uploadedAt,
      })),
      initiatedAt: kycVerification.createdAt,
      approvedAt: kycVerification.approvedAt,
      rejectionReason: kycVerification.rejectionReason,
      isAutoApproved: AUTO_APPROVE_KYC,
    };
  }

  static async isKYCApproved(userId : string) {
    if (AUTO_APPROVE_KYC) {
      return true;
    }
    const kycVerification = await KYCVerification.findOne({ user: userId });
    return kycVerification && kycVerification.status === "approved";
  }

  static async resubmitKYC(userId : string) {
    if (AUTO_APPROVE_KYC) {
      logger.info(`KYC resubmission skipped for user ${userId} due to auto-approval`);
      return { status: "approved" };
    }

    const kycVerification = await KYCVerification.findOne({ user: userId });
    if (!kycVerification) {
      throw new Error("KYC verification not found");
    }

    if (kycVerification.status !== "rejected") {
      throw new Error("KYC verification is not in rejected state");
    }

    kycVerification.status = "pending";
    kycVerification.rejectionReason = null;
    kycVerification.documents = [];

    await kycVerification.save();

    // Notify user about KYC resubmission
    await NotificationService.notifyKYCUpdate(userId, "pending");

    return kycVerification;
  }
}

export default KYCService;