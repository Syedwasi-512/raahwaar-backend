const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;
    console.error("🔥 Backend Error:", message);

    // Mongoose bad object ID
    if (err.name === 'CastError') {
        message = 'Resource not found';
        statusCode = 404;
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };