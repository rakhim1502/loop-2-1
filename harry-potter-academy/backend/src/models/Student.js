import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  // User Reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  
  // Personal Information
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  nationality: {
    type: String,
    default: 'Uzbekistan',
  },
  
  // Parent/Guardian Information
  parent: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    relationship: {
      type: String,
      enum: ['father', 'mother', 'guardian', 'other'],
      default: 'father',
    },
  },
  
  // Branch Assignment
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  
  // Student ID
  studentId: {
    type: String,
    unique: true,
    sparse: true,
  },
  
  // Academic Information
  grade: String,
  school: String,
  previousEducation: {
    institution: String,
    graduationYear: Number,
    certificate: {
      url: String,
      publicId: String,
    },
  },
  
  // Enrolled Courses
  enrolledCourses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped', 'paused'],
      default: 'active',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startDate: Date,
    expectedEndDate: Date,
    actualEndDate: Date,
  }],
  
  // Attendance Summary
  attendance: {
    totalClasses: {
      type: Number,
      default: 0,
    },
    attended: {
      type: Number,
      default: 0,
    },
    missed: {
      type: Number,
      default: 0,
    },
    late: {
      type: Number,
      default: 0,
    },
    excused: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
  },
  
  // Grades and Performance
  grades: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    assignment: String,
    score: Number,
    maxScore: Number,
    percentage: Number,
    grade: String,
    submittedAt: Date,
    gradedAt: Date,
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
  }],
  
  // Financial Information
  balance: {
    type: Number,
    default: 0,
  },
  paymentHistory: [{
    amount: Number,
    method: {
      type: String,
      enum: ['cash', 'click', 'payme', 'uzum', 'transfer'],
    },
    transactionId: String,
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed',
    },
    description: String,
    receipt: {
      url: String,
      publicId: String,
    },
  }],
  
  // Certificates Earned
  certificates: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    certificateNumber: String,
    issueDate: Date,
    certificate: {
      url: String,
      publicId: String,
    },
    grade: String,
    score: Number,
  }],
  
  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['passport', 'birth_certificate', 'photo', 'contract', 'other'],
    },
    url: String,
    publicId: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Notes and Comments
  notes: [{
    title: String,
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  enrollmentStatus: {
    type: String,
    enum: ['prospective', 'enrolled', 'graduated', 'dropped', 'transferred'],
    default: 'prospective',
  },
  registrationSource: {
    type: String,
    enum: ['website', 'instagram', 'telegram', 'facebook', 'referral', 'walk-in', 'phone', 'other'],
    default: 'website',
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Generate student ID before saving
studentSchema.pre('save', async function(next) {
  if (this.isNew && !this.studentId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      branch: this.branch,
    });
    this.studentId = `HPA-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Index for faster queries
studentSchema.index({ user: 1 });
studentSchema.index({ studentId: 1 });
studentSchema.index({ branch: 1, isActive: 1 });
studentSchema.index({ enrollmentStatus: 1 });
studentSchema.index({ 'parent.phone': 1 });
studentSchema.index({ createdAt: -1 });

// Virtual for current courses
studentSchema.virtual('currentCourses', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'student',
  match: { status: 'active' },
});

// Static method to find active students
studentSchema.statics.findActive = function() {
  return this.find({ isActive: true, enrollmentStatus: 'enrolled' })
    .populate('user', 'firstName lastName email avatar phone')
    .populate('branch', 'name slug');
};

// Static method to search students
studentSchema.statics.search = function(query) {
  return this.find({
    isActive: true,
    $or: [
      { studentId: { $regex: query, $options: 'i' } },
      { 'parent.firstName': { $regex: query, $options: 'i' } },
      { 'parent.lastName': { $regex: query, $options: 'i' } },
      { school: { $regex: query, $options: 'i' } },
    ],
  })
    .populate('user', 'firstName lastName email avatar');
};

// Method to calculate attendance percentage
studentSchema.methods.calculateAttendance = function() {
  const total = this.attendance.totalClasses;
  if (total === 0) {
    this.attendance.percentage = 0;
  } else {
    this.attendance.percentage = Math.round((this.attendance.attended / total) * 100);
  }
  return this.attendance.percentage;
};

// Method to update attendance
studentSchema.methods.updateAttendance = function(status) {
  this.attendance.totalClasses += 1;
  
  if (status === 'present') {
    this.attendance.attended += 1;
  } else if (status === 'absent') {
    this.attendance.missed += 1;
  } else if (status === 'late') {
    this.attendance.late += 1;
    this.attendance.attended += 1;
  } else if (status === 'excused') {
    this.attendance.excused += 1;
    this.attendance.attended += 1;
  }
  
  this.calculateAttendance();
};

// Method to add payment
studentSchema.methods.addPayment = async function(paymentData) {
  this.paymentHistory.push(paymentData);
  this.balance -= paymentData.amount;
  await this.save();
};

// Method to get enrollment by course
studentSchema.methods.getEnrollment = function(courseId) {
  return this.enrolledCourses.find(
    (enrollment) => enrollment.course.toString() === courseId.toString()
  );
};

const Student = mongoose.model('Student', studentSchema);

export default Student;
