import {z} from "zod";

export const validateWalletCreation = z.object({
    userId: z.string(),
    email: z.string().email(),
}).required();