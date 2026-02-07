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

// Skill Schema - user-created reusable prompt templates
const skillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  content: {
    type: String,
    required: true,
    maxlength: 50000  // Allow large skill content
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50,
    default: null
  },
  tags: {
    type: [String],
    default: []
  },
  is_public: {
    type: Boolean,
    default: false  // Future: allow sharing skills
  },
  source_prompt: {
    type: String,
    default: null  // Original prompt if AI-generated
  },
  enabled: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update updated_at on save
skillSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Index for efficient queries
skillSchema.index({ user: 1, enabled: 1 });
skillSchema.index({ user: 1, category: 1 });
skillSchema.index({ user: 1, tags: 1 });

// Category Schema - for organizing skills
const categorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  color: {
    type: String,
    default: '#6366f1'  // Default indigo color
  },
  icon: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique category names per user
categorySchema.index({ user: 1, name: 1 }, { unique: true });

export const User = mongoose.model('User', userSchema);
export const ExtensionRequest = mongoose.model('ExtensionRequest', extensionRequestSchema);
export const Skill = mongoose.model('Skill', skillSchema);
export const Category = mongoose.model('Category', categorySchema);

