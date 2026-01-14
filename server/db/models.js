import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 30
  },
  password_hash: {
    type: String,
    default: null
  },
  is_admin: {
    type: Boolean,
    default: false
  },
  // Usage tracking for prompt-based education service
  usage_count: {
    type: Number,
    default: 0
  },
  usage_limit: {
    type: Number,
    default: 5  // Default 5 free prompts
  },
  is_unlimited: {
    type: Boolean,
    default: false  // Admin users will have this set to true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// InviteCode Schema
const inviteCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  used_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  used_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// ExtensionRequest Schema - for users requesting more prompts
const extensionRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  requested_amount: {
    type: Number,
    default: null  // null = requesting unlimited access
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  admin_response: {
    type: String,
    default: null
  },
  granted_amount: {
    type: Number,
    default: null  // What admin actually granted (null if unlimited)
  },
  granted_unlimited: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  resolved_at: {
    type: Date,
    default: null
  }
});

export const User = mongoose.model('User', userSchema);
export const InviteCode = mongoose.model('InviteCode', inviteCodeSchema);
export const ExtensionRequest = mongoose.model('ExtensionRequest', extensionRequestSchema);

