const express = require('express');
const dotenv = require('dotenv');
const cors = require("cors");
const helmet = require("helmet"); // Security headers
const rateLimit = require("express-rate-limit"); // Rate limiting
const compression = require("compression"); // Response compression for speed
const morgan = require("morgan"); // Request logging
const cookieParser = require('cookie-parser');
const connectDB = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");

// Load Env
dotenv.config();

// Connect Database
connectDB();

const app = express();

// --- 1. SECURITY MIDDLEWARES (Industrial Standard) ---

// Helmet: HTTP headers ko secure karta hai
app.use(helmet());

// CORS: Sirf apne frontend ko access dena
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}));

// Rate Limiter: Ek IP se 15 min mein sirf 100 requests (DDoS protection)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later."
});
app.use("/api", limiter);

// Body Parser: Limit set karna taake koi bohot bari JSON file bhej kar server crash na kare
app.use(express.json({ limit: '10kb' }));

// --- CUSTOM NOSQL INJECTION PROTECTION ---
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (obj instanceof Object) {
            for (let key in obj) {
                if (key.startsWith('$')) {
                    delete obj[key]; // Hacker ke $ commands ko delete kar do
                } else {
                    sanitize(obj[key]); // Deep cleaning
                }
            }
        }
    };
    sanitize(req.body);
    sanitize(req.params);
    sanitize(req.query);
    next();
});

// Compression: API response ko compress karta hai taake website fast load ho
app.use(compression());

// Logging: Development mode mein requests console par dikhayega
//route response time ko bhi show karega on live site pa
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(cookieParser());

// --- 2. CRON JOBS ---
require("./cron/cancelExpiredOrders");

// --- 3. ROUTES ---
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/products', require("./routes/productRoutes"));
app.use("/api/orders", require('./routes/orderRoutes'));
app.use("/api/cart", require('./routes/cartRoutes'));
app.use("/api/filters", require("./routes/filter.Routes"));
app.use("/api/ai", require("./routes/aiRoutes"));

// --- 4. ERROR HANDLING ---

// 404 Route handler
app.use((req, res, next) => {
    res.status(404).json({ 
        success: false, 
        message: `Can't find ${req.originalUrl} on this server!` 
    });
});

// Global Error Middleware (App crash hone se bachayega)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// --- 5. GRACEFUL SHUTDOWN ---
// Agar database mein error aaye to server ko safely band karna
process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});