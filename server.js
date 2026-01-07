const express = require('express');
const dotenv = require('dotenv');
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require('cookie-parser');
const connectDB = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");

// Load Environment Variables
dotenv.config();

// Initialize Database
connectDB();

const app = express();

// Vercel/Render ke liye zaroori hai
app.set('trust proxy', 1); 

// --- 1. SECURITY & OPTIMIZATION ---

// Helmet: Secure headers (crossOriginResourcePolicy: false zaroori hai images ke liye)
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS: Flexible origin for Vite and Vercel
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean);
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Rate Limiting: DDOS Protection
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later."
});
app.use("/api", limiter);

// Body Parsers & Sanitization
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// --- CUSTOM NOSQL INJECTION PROTECTION (Safe for Node 20+) ---
app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (obj instanceof Object) {
            for (let key in obj) {
                if (key.startsWith('$')) {
                    delete obj[key];
                } else {
                    sanitize(obj[key]);
                }
            }
        }
    };
    sanitize(req.body);
    sanitize(req.params);
    sanitize(req.query);
    next();
});

app.use(compression());

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// --- 2. CRON JOBS ---
require("./cron/cancelExpiredOrders");

// --- 3. ROUTES ---

// Welcome Route (Taake Vercel link par 404 na aaye)
app.get("/", (req, res) => {
    res.status(200).json({ success: true, message: "Raahwaar API is running smoothly." });
});

app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/products', require("./routes/productRoutes"));
app.use("/api/orders", require('./routes/orderRoutes'));
app.use("/api/cart", require('./routes/cartRoutes'));
app.use("/api/filters", require("./routes/filter.routes")); // Ensure file is 'filter.routes.js'
app.use("/api/ai", require("./routes/aiRoutes"));

// --- 4. ERROR HANDLING ---

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ 
        success: false, 
        message: `Route ${req.originalUrl} not found on this server.` 
    });
});

// Global Error Middleware
app.use(errorHandler);

// --- 5. SERVER EXECUTION ---

// Vercel par 'app.listen' nahi chalta, sirf local development mein chalta hai
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
}

// --- CRITICAL FOR VERCEL ---
module.exports = app;