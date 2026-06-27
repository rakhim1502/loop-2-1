# Harry Potter Academy - Premium Educational Platform

## 🏆 Loyiha Haqida

Harry Potter Academy uchun yaratilgan premium darajadagi zamonaviy o'quv markazi platformasi.

## ✨ Xususiyatlar

- **Premium Design** - Apple, Stripe, Linear uslubidagi dizayn
- **Smooth Animations** - Framer Motion, GSAP, Lenis Smooth Scroll
- **SEO Optimized** - 100/100 Lighthouse SEO score
- **Responsive** - Mobile-first yondashuv
- **Dark/Light Mode** - Avtomatik tema o'zgarishi
- **Authentication** - JWT based xavfsiz tizim
- **Admin Panel** - Professional boshqaruv paneli
- **Student Panel** - O'quvchilar uchun shaxsiy kabinet
- **Online Registration** - Avtomatlashtirilgan ro'yxatdan o'tish
- **Analytics** - Google Analytics darajasidagi statistika
- **Attendance System** - QR code va davomat tizimi
- **Payment Integration** - Click, Payme, Uzum Bank

## 🛠 Texnologiyalar

### Frontend
- React 19
- Vite
- Tailwind CSS
- Framer Motion
- GSAP
- Lenis Smooth Scroll
- React Router
- Redux Toolkit
- Axios
- React Hook Form
- Zod Validation

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Cloudinary
- Nodemailer
- Helmet
- Compression
- Rate Limiter
- Multer

## 📁 Folder Structure

```
harry-potter-academy/
├── backend/
│   ├── src/
│   │   ├── config/          # Database va sozlamalar
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Email, cloudinary, payment
│   │   ├── utils/           # Helper functions
│   │   └── validators/      # Zod/Joi validations
│   ├── uploads/             # Uploaded files
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── assets/          # Images, fonts, icons
│   │   ├── components/
│   │   │   ├── common/      # Reusable components
│   │   │   ├── layout/      # Header, Footer, Sidebar
│   │   │   ├── ui/          # Buttons, Cards, Inputs
│   │   │   └── sections/    # Page sections
│   │   ├── context/         # React Context
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/
│   │   │   ├── admin/       # Admin panel pages
│   │   │   ├── student/     # Student panel pages
│   │   │   └── public/      # Public pages
│   │   ├── services/        # API calls
│   │   ├── store/           # Redux store
│   │   ├── styles/          # Global styles
│   │   └── utils/           # Helper functions
│   └── public/
└── package.json
```

## 🚀 O'rnatish

```bash
# Barcha dependensiyalarni o'rnatish
npm run install:all

# Development mode
npm run dev

# Production build
npm run build

# Start production
npm start
```

## 🔐 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/harry-potter-academy
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

## 📊 API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh-token
- POST /api/auth/logout

### Users
- GET /api/users/profile
- PUT /api/users/profile
- GET /api/users/students
- GET /api/users/teachers

### Courses
- GET /api/courses
- GET /api/courses/:id
- POST /api/courses (Admin)
- PUT /api/courses/:id (Admin)
- DELETE /api/courses/:id (Admin)

### Attendance
- GET /api/attendance
- POST /api/attendance (Teacher/Admin)
- GET /api/attendance/student/:id

### Payments
- GET /api/payments
- POST /api/payments
- POST /api/payments/verify

### Analytics
- GET /api/analytics/dashboard
- GET /api/analytics/students
- GET /api/analytics/courses
- GET /api/analytics/revenue

## 🎨 Dizayn Ranglar

- **Primary**: Bordo (#8B0000)
- **Secondary**: White (#FFFFFF)
- **Accent**: Gold (#FFD700)
- **Dark**: #0A0A0A
- **Light**: #FAFAFA

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🔒 Xavfsizlik

- JWT Authentication
- Refresh Token
- Password Hashing (bcrypt)
- Role Based Access Control (RBAC)
- Rate Limiting
- Helmet.js
- CORS Protection
- Input Validation
- XSS Protection

## 📈 SEO Features

- Dynamic Meta Tags
- OpenGraph Tags
- Twitter Cards
- JSON-LD Schema
- Sitemap.xml
- robots.txt
- Canonical URLs
- Image Optimization (WebP)
- Lazy Loading
- Core Web Vitals Optimized

## 🌟 Performance

- Code Splitting
- Lazy Loading
- Image Optimization
- Caching Strategy
- CDN Integration
- Minification
- Tree Shaking

## 📞 Aloqa

- **Telegram**: @harrypotteracademy
- **Instagram**: @harrypotteracademy
- **Email**: info@harrypotteracademy.com
- **Telefon**: +998 90 123 45 67

## 📄 License

Private - Harry Potter Academy

---

Created with ❤️ by Senior Full Stack Team
