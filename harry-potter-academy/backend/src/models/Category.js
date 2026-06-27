import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  
  // SEO
  seoTitle: String,
  seoDescription: String,
  metaKeywords: [String],
  
  // Icon and Image
  icon: {
    type: String,
    default: '',
  },
  image: {
    url: String,
    publicId: String,
  },
  
  // Parent Category (for nested categories)
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  
  // Order and Display
  order: {
    type: Number,
    default: 0,
  },
  color: {
    type: String,
    default: '#8B0000',
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  
  // Statistics
  courseCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Create slug from name before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Update course count before saving
categorySchema.pre('save', async function(next) {
  if (this.isNew) {
    const Course = mongoose.model('Course');
    const count = await Course.countDocuments({ category: this._id, isActive: true });
    this.courseCount = count;
  }
  next();
});

// Index for faster queries
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ order: 1, isFeatured: -1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
  options: { sort: { order: 1 } },
});

// Virtual for courses
categorySchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'category',
  options: { sort: { createdAt: -1 } },
});

// Static method to find active categories
categorySchema.statics.findActive = function() {
  return this.find({ isActive: true })
    .sort({ order: 1, isFeatured: -1 })
    .populate('parent', 'name slug');
};

// Static method to find featured categories
categorySchema.statics.findFeatured = function(limit = 6) {
  return this.find({ isActive: true, isFeatured: true })
    .sort({ order: 1 })
    .limit(limit);
};

// Static method to find root categories (no parent)
categorySchema.statics.findRootCategories = function() {
  return this.find({ isActive: true, parent: null })
    .sort({ order: 1 })
    .populate('subcategories', 'name slug icon color');
};

// Method to update course count
categorySchema.methods.updateCourseCount = async function() {
  const Course = mongoose.model('Course');
  const count = await Course.countDocuments({ category: this._id, isActive: true });
  this.courseCount = count;
  await this.save();
  return count;
};

const Category = mongoose.model('Category', categorySchema);

export default Category;
