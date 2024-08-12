"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const uuid_1 = require("uuid");
const enum_1 = require("../enum");
const userSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.UUID, default: uuid_1.v4, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: Object.values(enum_1.UserStatus),
        default: enum_1.UserStatus.ACTIVE
    }
});
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
