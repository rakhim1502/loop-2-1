import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  // User Reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  
  // Professional Information
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
  },
  specialization: [{
    type: String,
    required: true,
  }],
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  
  // Experience
  experience: {
    years: {
      type: Number,
      default: 0,
    },
    description: String,
    previousCompanies: [String],
  },
  
  // Education
  education: [{
    degree: String,
    field: String,
    institution: String,
    graduationYear: Number,
    certificate: {
      url: String,
      publicId: String,
    },
  }],
  
  // Certifications
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    certificateNumber: String,
    certificate: {
      url: String,
      publicId: String,
    },
  }],
  
  // Languages
  languages: [{
    language: {
      type: String,
      enum: ['uzbek', 'english', 'russian', 'turkish', 'korean', 'german', 'french'],
    },
    level: {
      type: String,
      enum: ['native', 'fluent', 'advanced', 'intermediate', 'basic'],
    },
  }],
  
  // Branch Assignment
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  
  // Schedule
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    startTime: String,
    endTime: String,
    isAvailable: {
      type: Boolean,
      default: true,
    },
  }],
  
  // Teaching Style
  teachingStyle: [String],
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters'],
  },
  tagline: {
    type: String,
    maxlength: [100, 'Tagline cannot exceed 100 characters'],
  },
  
  // Media
  avatar: {
    url: String,
    publicId: String,
  },
  coverImage: {
    url: String,
    publicId: String,
  },
  gallery: [{
    url: String,
    publicId: String,
    caption: String,
  }],
  introVideo: {
    url: String,
    publicId: String,
    duration: Number,
  },
  
  // Social Links
  socialLinks: {
    telegram: String,
    instagram: String,
    facebook: String,
    linkedin: String,
    twitter: String,
    youtube: String,
    website: String,
  },
  
  // Statistics
  stats: {
    totalStudents: {
      type: Number,
      default: 0,
    },
    totalCourses: {
      type: Number,
      default: 0,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      default: 0,
    },
    successRate: {
      type: Number,
      default: 0,
    },
  },
  
  // Awards and Achievements
  awards: [{
    title: String,
    issuer: String,
    date: Date,
    description: String,
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  hireDate: Date,
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'freelance'],
    default: 'full-time',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index for faster queries
teacherSchema.index({ user: 1 });
teacherSchema.index({ branch: 1, isActive: 1 });
teacherSchema.index({ specialization: 1 });
teacherSchema.index({ 'stats.averageRating': -1, isFeatured: -1 });
teacherSchema.index({ isActive: 1, isFeatured: 1 });

// Virtual for courses
teacherSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'teacher',
  options: { sort: { createdAt: -1 } },
});

// Virtual for students
teacherSchema.virtual('students', {
  ref: 'Enrollment',
  localField: 'courses',
  foreignField: 'course',
});

// Static method to find active teachers
teacherSchema.statics.findActive = function() {
  return this.find({ isActive: true })
    .populate('user', 'firstName lastName email avatar')
    .populate('branch', 'name slug')
    .sort({ isFeatured: -1, 'stats.averageRating': -1 });
};

// Static method to find featured teachers
teacherSchema.statics.findFeatured = function(limit = 6) {
  return this.find({ isActive: true, isFeatured: true })
    .populate('user', 'firstName lastName avatar')
    .sort({ 'stats.averageRating': -1, 'stats.totalStudents': -1 })
    .limit(limit);
};

// Static method to search teachers
teacherSchema.statics.search = function(query) {
  return this.find({
    isActive: true,
    $or: [
      { specialization: { $regex: query, $options: 'i' } },
      { bio: { $regex: query, $options: 'i' } },
      { tagline: { $regex: query, $options: 'i' } },
    ],
  })
    .populate('user', 'firstName lastName avatar')
    .populate('branch', 'name');
};

// Static method to filter teachers by specialization
teacherSchema.statics.findBySpecialization = function(specialization) {
  return this.find({
    isActive: true,
    specialization: { $regex: specialization, $options: 'i' },
  })
    .populate('user', 'firstName lastName avatar')
    .sort({ 'stats.averageRating': -1 });
};

// Method to update statistics
teacherSchema.methods.updateStats = async function() {
  const Course = mongoose.model('Course');
  const Enrollment = mongoose.model('Enrollment');
  const Review = mongoose.model('Review');
  
  // Count courses
  const courseCount = await Course.countDocuments({ teacher: this._id, isActive: true });
  
  // Count students
  const courses = await Course.find({ teacher: this._id }).select('_id');
  const courseIds = courses.map(c => c._id);
  const studentCount = await Enrollment.countDocuments({
    course: { $in: courseIds },
    status: 'active',
  });
  
  // Calculate average rating
  const reviews = await Review.find({ course: { $in: courseIds } });
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  
  // Update stats
  this.stats = {
    totalStudents: studentCount,
    totalCourses: courseCount,
    totalHours: this.experience.years * 520, // Approximate hours per year
    averageRating: Math.round(avgRating * 10) / 10,
    totalReviews: reviews.length,
    completionRate: this.stats.completionRate,
    successRate: this.stats.successRate,
  };
  
  await this.save();
};

const Teacher = mongoose.model('Teacher', teacherSchema);

export default Teacher;
