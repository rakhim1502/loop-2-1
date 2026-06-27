import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
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
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
  },
  
  // Date and Time
  date: {
    type: Date,
    required: true,
  },
  checkInTime: Date,
  checkOutTime: Date,
  
  // Status
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused', 'left_early'],
    required: true,
  },
  
  // Marked By
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
  },
  
  // Method
  method: {
    type: String,
    enum: ['manual', 'qr_code', 'face_recognition', 'fingerprint', 'auto'],
    default: 'manual',
  },
  
  // QR Code Data (if applicable)
  qrCode: {
    code: String,
    scannedAt: Date,
    location: {
      latitude: Number,
      longitude: Number,
    },
  },
  
  // Notes
  notes: String,
  excuseDocument: {
    url: String,
    publicId: String,
  },
  
  // Late Details
  minutesLate: {
    type: Number,
    default: 0,
  },
  
  // Left Early Details
  leftEarlyAt: Date,
  earlyDepartureReason: String,
  
  // Verified
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index for faster queries
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ course: 1, date: -1 });
attendanceSchema.index({ date: -1, status: 1 });
attendanceSchema.index({ enrollment: 1, date: -1 });
attendanceSchema.index({ markedBy: 1, date: -1 });

// Compound index for unique attendance per student per course per date
attendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });

// Virtual for student info
attendanceSchema.virtual('studentInfo', {
  ref: 'Student',
  localField: 'student',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course info
attendanceSchema.virtual('courseInfo', {
  ref: 'Course',
  localField: 'course',
  foreignField: '_id',
  justOne: true,
});

// Static method to find by date
attendanceSchema.statics.findByDate = function(date, courseId) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const query = {
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  };
  
  if (courseId) {
    query.course = courseId;
  }
  
  return this.find(query)
    .populate('student', 'user firstName lastName studentId')
    .populate('course', 'name slug')
    .populate('markedBy', 'firstName lastName')
    .sort({ checkInTime: 1 });
};

// Static method to find by student
attendanceSchema.statics.findByStudent = function(studentId, courseId, startDate, endDate) {
  const query = { student: studentId };
  
  if (courseId) {
    query.course = courseId;
  }
  
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  
  return this.find(query)
    .populate('course', 'name slug')
    .sort({ date: -1 });
};

// Static method to get statistics
attendanceSchema.statics.getStats = async function(courseId, startDate, endDate) {
  const matchStage = {};
  
  if (courseId) {
    matchStage.course = mongoose.Types.ObjectId(courseId);
  }
  
  if (startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$course',
        totalClasses: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
        },
        absent: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
        },
        late: {
          $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
        },
        excused: {
          $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 1,
        totalClasses: 1,
        present: 1,
        absent: 1,
        late: 1,
        excused: 1,
        attendanceRate: {
          $round: [
            { $multiply: [{ $divide: ['$present', '$totalClasses'] }, 100] },
            2,
          ],
        },
      },
    },
  ]);
  
  return stats[0] || {};
};

// Static method to generate report
attendanceSchema.statics.generateReport = async function(courseId, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const report = await this.aggregate([
    {
      $match: {
        course: mongoose.Types.ObjectId(courseId),
        date: {
          $gte: start,
          $lte: end,
        },
      },
    },
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: '$student' },
    {
      $lookup: {
        from: 'users',
        localField: 'student.user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $group: {
        _id: '$student._id',
        studentName: { $first: { $concat: ['$user.firstName', ' ', '$user.lastName'] } },
        studentId: { $first: '$student.studentId' },
        totalDays: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
        },
        absent: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
        },
        late: {
          $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
        },
        excused: {
          $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        studentId: 1,
        studentName: 1,
        totalDays: 1,
        present: 1,
        absent: 1,
        late: 1,
        excused: 1,
        attendanceRate: {
          $round: [
            { $multiply: [{ $divide: ['$present', '$totalDays'] }, 100] },
            2,
          ],
        },
      },
    },
    { $sort: { attendanceRate: -1 } },
  ]);
  
  return report;
};

// Pre-save hook to update enrollment attendance
attendanceSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('status')) {
    const Enrollment = mongoose.model('Enrollment');
    const enrollment = await Enrollment.findById(this.enrollment);
    
    if (enrollment) {
      enrollment.attendance.totalClasses += this.isNew ? 1 : 0;
      
      if (this.status === 'present') {
        enrollment.attendance.attended += 1;
      } else if (this.status === 'absent') {
        enrollment.attendance.missed += 1;
      } else if (this.status === 'late') {
        enrollment.attendance.late += 1;
        enrollment.attendance.attended += 1;
      } else if (this.status === 'excused') {
        enrollment.attendance.excused += 1;
        enrollment.attendance.attended += 1;
      }
      
      await enrollment.save();
    }
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
