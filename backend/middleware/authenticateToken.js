const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized - Missing token' });
    }
    
    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET_KEY, (error, decoded) => {
        if (error) {
            return res.status(401).json({ message: 'Unauthorized - Invalid token' });
        }
        req.userId = decoded._id;
        next();
    })
}

module.exports = authenticateToken;