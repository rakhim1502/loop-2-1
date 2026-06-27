import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // Student and Enrollment
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative'],
  },
  currency: {
    type: String,
    default: 'UZS',
    enum: ['UZS', 'USD', 'EUR'],
  },
  
  // Payment Method
  method: {
    type: String,
    enum: ['cash', 'click', 'payme', 'uzum', 'transfer', 'card', 'other'],
    required: true,
  },
  
  // Transaction Details
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
  },
  merchantTransactionId: String,
  orderId: String,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
  },
  
  // Payment Gateway Response
  gatewayResponse: {
    code: String,
    message: String,
    data: mongoose.Schema.Types.Mixed,
  },
  
  // Receipt
  receipt: {
    number: String,
    url: String,
    publicId: String,
  },
  
  // Description
  description: String,
  purpose: {
    type: String,
    enum: ['course_fee', 'registration_fee', 'material_fee', 'exam_fee', 'certificate_fee', 'other'],
    default: 'course_fee',
  },
  
  // Dates
  paidAt: Date,
  dueDate: Date,
  refundDate: Date,
  
  // Refund Details
  refund: {
    requested: {
      type: Boolean,
      default: false,
    },
    approved: {
      type: Boolean,
      default: false,
    },
    amount: Number,
    reason: String,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: Date,
  },
  
  // Processed By
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: Date,
  
  // Notes
  notes: String,
  internalNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Invoice
  invoice: {
    number: String,
    url: String,
    publicId: String,
    issuedAt: Date,
  },
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceInfo: String,
    location: {
      city: String,
      country: String,
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Generate receipt number before saving
paymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.receipt.number) {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1),
      },
    });
    this.receipt.number = `RCT-${year}-${String(month).padStart(2, '0')}-${String(count + 1).padStart(5, '0')}`;
  }
  
  if (this.isNew && !this.invoice.number) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      },
    });
    this.invoice.number = `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  next();
});

// Index for faster queries
paymentSchema.index({ student: 1, createdAt: -1 });
paymentSchema.index({ enrollment: 1, status: 1 });
paymentSchema.index({ course: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ method: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for student info
paymentSchema.virtual('studentInfo', {
  ref: 'Student',
  localField: 'student',
  foreignField: '_id',
  justOne: true,
});

// Virtual for course info
paymentSchema.virtual('courseInfo', {
  ref: 'Course',
  localField: 'course',
  foreignField: '_id',
  justOne: true,
});

// Static method to find by student
paymentSchema.statics.findByStudent = function(studentId) {
  return this.find({ student: studentId })
    .populate('course', 'name slug')
    .populate('enrollment', 'status')
    .sort({ createdAt: -1 });
};

// Static method to find by date range
paymentSchema.statics.findByDateRange = function(startDate, endDate, filters = {}) {
  const query = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  };
  
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.method) {
    query.method = filters.method;
  }
  if (filters.course) {
    query.course = filters.course;
  }
  
  return this.find(query)
    .populate('student', 'user firstName lastName')
    .populate('course', 'name')
    .sort({ createdAt: -1 });
};

// Static method to get revenue statistics
paymentSchema.statics.getRevenueStats = async function(startDate, endDate, groupBy = 'month') {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let dateFormat;
  switch (groupBy) {
    case 'day':
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      break;
    case 'week':
      dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
      break;
    case 'year':
      dateFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
      break;
    default:
      dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  }
  
  const stats = await this.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },
    {
      $group: {
        _id: dateFormat,
        totalRevenue: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
        averageTransaction: { $avg: '$amount' },
        byMethod: {
          $push: {
            method: '$method',
            amount: '$amount',
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        totalRevenue: 1,
        transactionCount: 1,
        averageTransaction: { $round: ['$averageTransaction', 2] },
        byMethod: {
          click: {
            $sum: {
              $cond: [{ $eq: ['$byMethod.method', 'click'] }, '$byMethod.amount', 0],
            },
          },
          payme: {
            $sum: {
              $cond: [{ $eq: ['$byMethod.method', 'payme'] }, '$byMethod.amount', 0],
            },
          },
          cash: {
            $sum: {
              $cond: [{ $eq: ['$byMethod.method', 'cash'] }, '$byMethod.amount', 0],
            },
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  
  return stats;
};

// Static method to get payment summary
paymentSchema.statics.getSummary = async function() {
  const summary = await this.aggregate([
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
  
  const result = {
    total: { amount: 0, count: 0 },
    byStatus: {},
  };
  
  summary.forEach((item) => {
    result.byStatus[item._id] = {
      amount: item.totalAmount,
      count: item.count,
    };
    if (item._id === 'completed') {
      result.total.amount = item.totalAmount;
      result.total.count = item.count;
    }
  });
  
  return result;
};

// Method to mark as completed
paymentSchema.methods.complete = function(transactionData) {
  this.status = 'completed';
  this.paidAt = new Date();
  
  if (transactionData) {
    this.transactionId = transactionData.transactionId;
    this.merchantTransactionId = transactionData.merchantTransactionId;
    this.gatewayResponse = transactionData.gatewayResponse;
  }
};

// Method to mark as failed
paymentSchema.methods.fail = function(reason) {
  this.status = 'failed';
  this.gatewayResponse = {
    code: 'FAILED',
    message: reason,
  };
};

// Method to request refund
paymentSchema.methods.requestRefund = function(reason) {
  this.refund.requested = true;
  this.refund.reason = reason;
  this.refund.requestedAt = new Date();
};

// Method to process refund
paymentSchema.methods.processRefund = async function(processedBy, amount) {
  this.refund.approved = true;
  this.refund.amount = amount || this.amount;
  this.refund.processedBy = processedBy;
  this.refund.processedAt = new Date();
  this.refundDate = new Date();
  this.status = 'refunded';
  
  // Update student balance
  const Student = mongoose.model('Student');
  const student = await Student.findById(this.student);
  if (student) {
    student.balance += this.refund.amount;
    await student.save();
  }
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
