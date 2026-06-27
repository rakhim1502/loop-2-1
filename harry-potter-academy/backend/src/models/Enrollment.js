import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  // Student and Course
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  
  // Enrollment Details
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  startDate: Date,
  expectedEndDate: Date,
  actualEndDate: Date,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'dropped', 'paused', 'cancelled'],
    default: 'pending',
  },
  
  // Payment
  fee: {
    type: Number,
    required: true,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  remainingAmount: {
    type: Number,
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'refunded'],
    default: 'unpaid',
  },
  paymentPlan: {
    type: String,
    enum: ['one-time', 'monthly', 'quarterly'],
    default: 'one-time',
  },
  
  // Progress Tracking
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedWeeks: {
      type: Number,
      default: 0,
    },
    totalWeeks: Number,
    currentWeek: {
      type: Number,
      default: 1,
    },
  },
  
  // Attendance for this enrollment
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
  
  // Grades
  grades: [{
    assignment: String,
    type: {
      type: String,
      enum: ['homework', 'quiz', 'test', 'exam', 'project', 'participation'],
    },
    score: Number,
    maxScore: Number,
    percentage: Number,
    weight: {
      type: Number,
      default: 1,
    },
    submittedAt: Date,
    gradedAt: Date,
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
  }],
  
  // Final Grade
  finalGrade: {
    score: Number,
    percentage: Number,
    letter: String,
    gradePoint: Number,
  },
  
  // Certificate
  certificate: {
    earned: {
      type: Boolean,
      default: false,
    },
    certificateNumber: String,
    issueDate: Date,
    certificate: {
      url: String,
      publicId: String,
    },
  },
  
  // Notes
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
  
  // Cancellation/ Drop Reason
  cancellationReason: String,
  droppedAt: Date,
  droppedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // Completed By
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  completedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Calculate remaining amount before saving
enrollmentSchema.pre('save', function(next) {
  if (this.fee !== undefined) {
    this.remainingAmount = this.fee - this.paidAmount;
    
    // Update payment status
    if (this.paidAmount === 0) {
      this.paymentStatus = 'unpaid';
    } else if (this.paidAmount >= this.fee) {
      this.paymentStatus = 'paid';
    } else {
      this.paymentStatus = 'partial';
    }
  }
  
  // Calculate attendance percentage
  if (this.attendance.totalClasses > 0) {
    this.attendance.percentage = Math.round(
      (this.attendance.attended / this.attendance.totalClasses) * 100
    );
  }
  
  next();
});

// Set expected end date if not provided
enrollmentSchema.pre('save', async function(next) {
  if (this.isNew && !this.expectedEndDate) {
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.course);
    if (course && course.duration.weeks) {
      const startDate = this.startDate || new Date();
      this.expectedEndDate = new Date(startDate);
      this.expectedEndDate.setDate(this.expectedEndDate.getDate() + (course.duration.weeks * 7));
      this.progress.totalWeeks = course.duration.weeks;
    }
  }
  next();
});

// Index for faster queries
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ status: 1, enrollmentDate: -1 });
enrollmentSchema.index({ paymentStatus: 1 });
enrollmentSchema.index({ createdAt: -1 });

// Compound index for unique active enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1, status: 1 }, { unique: true });

// Virtual for student info
enrollmentSchema.virtual('studentInfo', {
  ref: 'Student',
  localField: 'student',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course info
enrollmentSchema.virtual('courseInfo', {
  ref: 'Course',
  localField: 'course',
  foreignField: '_id',
  justOne: true,
});

// Static method to find active enrollments
enrollmentSchema.statics.findActive = function() {
  return this.find({ status: 'active' })
    .populate('student', 'user firstName lastName studentId')
    .populate('course', 'name slug')
    .sort({ enrollmentDate: -1 });
};

// Static method to find by student
enrollmentSchema.statics.findByStudent = function(studentId) {
  return this.find({ student: studentId })
    .populate('course', 'name slug thumbnail level')
    .sort({ enrollmentDate: -1 });
};

// Static method to find by course
enrollmentSchema.statics.findByCourse = function(courseId) {
  return this.find({ course: courseId })
    .populate('student', 'user firstName lastName studentId')
    .sort({ enrollmentDate: -1 });
};

// Static method to get statistics
enrollmentSchema.statics.getStats = async function(courseId) {
  const stats = await this.aggregate([
    { $match: { course: mongoose.Types.ObjectId(courseId), status: 'active' } },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        averageProgress: { $avg: '$progress.percentage' },
        averageAttendance: { $avg: '$attendance.percentage' },
        totalRevenue: { $sum: '$paidAmount' },
      },
    },
  ]);
  return stats[0] || {};
};

// Method to update progress
enrollmentSchema.methods.updateProgress = function(weekNumber) {
  this.progress.currentWeek = weekNumber;
  this.progress.completedWeeks = weekNumber - 1;
  if (this.progress.totalWeeks) {
    this.progress.percentage = Math.round(
      (this.progress.completedWeeks / this.progress.totalWeeks) * 100
    );
  }
};

// Method to add grade
enrollmentSchema.methods.addGrade = function(gradeData) {
  this.grades.push(gradeData);
};

// Method to calculate final grade
enrollmentSchema.methods.calculateFinalGrade = function() {
  if (this.grades.length === 0) return;
  
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  this.grades.forEach((grade) => {
    if (grade.percentage !== undefined) {
      totalWeightedScore += grade.percentage * (grade.weight || 1);
      totalWeight += grade.weight || 1;
    }
  });
  
  const percentage = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  
  this.finalGrade = {
    percentage: Math.round(percentage * 10) / 10,
    score: percentage,
    letter: this.getLetterGrade(percentage),
    gradePoint: this.getGradePoint(percentage),
  };
};

// Helper method to get letter grade
enrollmentSchema.methods.getLetterGrade = function(percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

// Helper method to get grade point
enrollmentSchema.methods.getGradePoint = function(percentage) {
  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.0;
  if (percentage >= 70) return 2.0;
  if (percentage >= 60) return 1.0;
  return 0.0;
};

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment;
