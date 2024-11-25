const jwt = require("jsonwebtoken");

exports.accessToken = async (user) => {
    const secretKey = process.env.JWT_SECRET || "default-secret-key";
    if (!process.env.JWT_SECRET) {
        console.warn("Warning: JWT_SECRET is not set. Using default secret key.");
    }

    return jwt.sign(
        { id: user.id, role: user.role },
        secretKey,
        { expiresIn: process.env.JWT_EXPIRE || "1h" }
    );
};