import express, {Request, Response } from 'express';
import KYCService from "../services/kyc.service";

import {
  authenticateJWT,
  authenticateAdmin,
} from "../middleware/auth.middleware";
// import upload from "../middleware/file-upload.middleware";

const kycRouter = express.Router();

kycRouter.post("/initiate", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const kycVerification = await KYCService.initiateKYC(req.body.user.id);
    res.status(201).json(kycVerification);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

// kycRouter.post(
//   "/upload-document",
//   authenticateJWT,
//   upload.single("document"),
//   async (req, res) => {
//     try {
//       if (!req.body.file) {
//         return res.status(400).json({ error: "No file uploaded" });
//       }
//
//       const { documentType } = req.body;
//       const kycVerification = await KYCService.uploadDocument(
//         req.body.user.id,
//         documentType,
//         req.body.file
//       );
//       res.json(kycVerification);
//     } catch (error : any) {
//       res.status(400).json({ error: error.message });
//     }
//   }
// );

kycRouter.get("/status", authenticateJWT, async (req, res) => {
  try {
    const status = await KYCService.getKYCStatus(req.body.user.id);
    res.json(status);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

// This route should be protected and only accessible by admin users
kycRouter.put("/update-status", authenticateAdmin, async (req, res) => {
  try {
    const { userId, newStatus } = req.body;
    const kycVerification = await KYCService.updateKYCStatus(userId, newStatus);
    res.json(kycVerification);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

export default kycRouter;