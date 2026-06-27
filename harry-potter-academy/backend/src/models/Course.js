import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    minlength: [3, 'Course name must be at least 3 characters'],
    maxlength: [100, 'Course name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  shortDescription: {
    type: String,
    required: [true, 'Short description is required'],
    maxlength: [200, 'Short description cannot exceed 200 characters'],
  },
  fullDescription: {
    type: String,
    required: [true, 'Full description is required'],
  },
  
  // Category
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  
  // Branch
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  
  // Teacher
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
  },
  currency: {
    type: String,
    default: 'UZS',
    enum: ['UZS', 'USD', 'EUR'],
  },
  
  // Duration and Schedule
  duration: {
    weeks: {
      type: Number,
      required: true,
    },
    hoursPerWeek: {
      type: Number,
      required: true,
    },
    totalHours: {
      type: Number,
    },
  },
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    startTime: String,
    endTime: String,
  }],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: Date,
  
  // Level and Requirements
  level: {
    type: String,
    enum: ['beginner', 'elementary', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'advanced', 'proficiency'],
    default: 'beginner',
  },
  prerequisites: [String],
  learningOutcomes: [String],
  
  // Course Content
  curriculum: [{
    week: Number,
    title: String,
    topics: [String],
    homework: String,
  }],
  materials: [{
    name: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'audio', 'link', 'document'],
    },
    url: String,
    publicId: String,
    isDownloadable: {
      type: Boolean,
      default: true,
    },
  }],
  
  // Media
  thumbnail: {
    url: String,
    publicId: String,
  },
  gallery: [{
    url: String,
    publicId: String,
    caption: String,
  }],
  promoVideo: {
    url: String,
    publicId: String,
    duration: Number,
  },
  
  // Capacity
  maxStudents: {
    type: Number,
    default: 15,
  },
  enrolledStudents: {
    type: Number,
    default: 0,
  },
  
  // Format
  format: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    default: 'offline',
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
  },
  
  // Certification
  certificateIncluded: {
    type: Boolean,
    default: true,
  },
  certificateType: String,
  
  // SEO
  seoTitle: String,
  seoDescription: String,
  metaKeywords: [String],
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  isNew: {
    type: Boolean,
    default: true,
  },
  
  // Statistics
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  completionRate: {
    type: Number,
    default: 0,
  },
  successRate: {
    type: Number,
    default: 0,
  },
  
  // Tags
  tags: [String],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Create slug from name before saving
courseSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Calculate total hours
  if (this.duration.weeks && this.duration.hoursPerWeek) {
    this.duration.totalHours = this.duration.weeks * this.duration.hoursPerWeek;
  }
  
  next();
});

// Index for faster queries
courseSchema.index({ slug: 1 });
courseSchema.index({ category: 1, isActive: 1 });
courseSchema.index({ branch: 1, isActive: 1 });
courseSchema.index({ teacher: 1, isActive: 1 });
courseSchema.index({ level: 1, isActive: 1 });
courseSchema.index({ format: 1, isActive: 1 });
courseSchema.index({ isFeatured: -1, rating: -1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ tags: 1 });

// Virtual for students
courseSchema.virtual('students', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'course',
});

// Virtual for reviews
courseSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'course',
  options: { sort: { createdAt: -1 } },
});

// Pre-remove hook to delete related enrollments
courseSchema.pre('remove', async function(next) {
  const Enrollment = mongoose.model('Enrollment');
  await Enrollment.deleteMany({ course: this._id });
  next();
});

// Static method to find active courses
courseSchema.statics.findActive = function() {
  return this.find({ isActive: true })
    .populate('category', 'name slug color')
    .populate('branch', 'name slug address')
    .populate('teacher', 'firstName lastName avatar')
    .sort({ isFeatured: -1, rating: -1, createdAt: -1 });
};

// Static method to find featured courses
courseSchema.statics.findFeatured = function(limit = 6) {
  return this.find({ isActive: true, isFeatured: true })
    .populate('category', 'name slug')
    .populate('teacher', 'firstName lastName avatar')
    .sort({ order: 1, rating: -1 })
    .limit(limit);
};

// Static method to find popular courses
courseSchema.statics.findPopular = function(limit = 4) {
  return this.find({ isActive: true, isPopular: true })
    .populate('category', 'name slug')
    .sort({ enrolledStudents: -1, rating: -1 })
    .limit(limit);
};

// Static method to search courses
courseSchema.statics.search = function(query) {
  return this.find({
    isActive: true,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { shortDescription: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
    ],
  })
    .populate('category', 'name slug')
    .populate('teacher', 'firstName lastName');
};

// Static method to filter courses
courseSchema.statics.filter = function(filters) {
  const query = { isActive: true };
  
  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.branch) {
    query.branch = filters.branch;
  }
  if (filters.level) {
    query.level = filters.level;
  }
  if (filters.format) {
    query.format = filters.format;
  }
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = filters.minPrice;
    if (filters.maxPrice) query.price.$lte = filters.maxPrice;
  }
  
  return this.find(query)
    .populate('category', 'name slug')
    .populate('branch', 'name')
    .populate('teacher', 'firstName lastName')
    .sort({ rating: -1, createdAt: -1 });
};

// Method to update statistics
courseSchema.methods.updateStats = async function() {
  const Enrollment = mongoose.model('Enrollment');
  const Review = mongoose.model('Review');
  
  // Count enrolled students
  const enrollmentCount = await Enrollment.countDocuments({
    course: this._id,
    status: 'active',
  });
  this.enrolledStudents = enrollmentCount;
  
  // Calculate rating
  const reviews = await Review.find({ course: this._id });
  if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    this.rating = {
      average: Math.round(avgRating * 10) / 10,
      count: reviews.length,
    };
  }
  
  await this.save();
};

const Course = mongoose.model('Course', courseSchema);

export default Course;
