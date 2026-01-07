// config/cookieConfig.js
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    path: "/"
};

module.exports = COOKIE_OPTIONS;