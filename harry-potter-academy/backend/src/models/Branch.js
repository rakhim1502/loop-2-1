import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  
  // Contact Information
  address: {
    fullAddress: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      default: 'Tashkent',
    },
    district: String,
    street: String,
    building: String,
    floor: String,
    apartment: String,
    zipCode: String,
  },
  phone: {
    type: String,
    required: true,
  },
  alternatePhone: String,
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
  googleMapsLink: String,
  yandexMapsLink: String,
  
  // Working Hours
  workingHours: {
    monday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true },
    },
    tuesday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true },
    },
    wednesday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true },
    },
    thursday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true },
    },
    friday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '18:00' },
      isOpen: { type: Boolean, default: true },
    },
    saturday: {
      open: { type: String, default: '10:00' },
      close: { type: String, default: '16:00' },
      isOpen: { type: Boolean, default: true },
    },
    sunday: {
      open: { type: String, default: '10:00' },
      close: { type: String, default: '16:00' },
      isOpen: { type: Boolean, default: false },
    },
  },
  
  // Facilities
  facilities: [{
    type: String,
    enum: ['wifi', 'parking', 'cafeteria', 'library', 'computer_lab', 'projector', 'ac', 'heating'],
  }],
  
  // Capacity
  capacity: {
    totalRooms: Number,
    totalSeats: Number,
  },
  
  // Images
  images: [{
    url: String,
    publicId: String,
    caption: String,
    isPrimary: Boolean,
  }],
  
  // Manager
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  
  // Statistics (denormalized for performance)
  stats: {
    totalStudents: {
      type: Number,
      default: 0,
    },
    totalTeachers: {
      type: Number,
      default: 0,
    },
    totalCourses: {
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
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Create slug from name before saving
branchSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Index for geospatial queries
branchSchema.index({ location: '2dsphere' });
branchSchema.index({ slug: 1 });
branchSchema.index({ isActive: 1, isFeatured: 1 });

// Virtual for rooms
branchSchema.virtual('rooms', {
  ref: 'Classroom',
  localField: '_id',
  foreignField: 'branch',
});

// Static method to find active branches
branchSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ isFeatured: -1, name: 1 });
};

// Static method to find by city
branchSchema.statics.findByCity = function(city) {
  return this.find({ isActive: true, 'address.city': city });
};

// Method to update statistics
branchSchema.methods.updateStats = async function() {
  const Classroom = mongoose.model('Classroom');
  const Student = mongoose.model('Student');
  const Teacher = mongoose.model('Teacher');
  const Course = mongoose.model('Course');
  const Review = mongoose.model('Review');
  
  // Count students
  const studentCount = await Student.countDocuments({ branch: this._id, isActive: true });
  
  // Count teachers
  const teacherCount = await Teacher.countDocuments({ branch: this._id, isActive: true });
  
  // Count courses
  const courseCount = await Course.countDocuments({ branch: this._id, isActive: true });
  
  // Calculate average rating
  const reviews = await Review.find({ branch: this._id });
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  
  // Update stats
  this.stats = {
    totalStudents: studentCount,
    totalTeachers: teacherCount,
    totalCourses: courseCount,
    averageRating: Math.round(avgRating * 10) / 10,
    totalReviews: reviews.length,
  };
  
  await this.save();
};

const Branch = mongoose.model('Branch', branchSchema);

export default Branch;
