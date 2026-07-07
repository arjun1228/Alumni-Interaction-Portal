export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Authentication context missing.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient privileges.'
            });
        }

        next();
    };
};

// Gatekeeping middleware to check if an alumni account is approved by admin
export const alumniApproved = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Authentication context missing.'
        });
    }

    if (req.user.role === 'alumni' && req.user.approvalStatus !== 'approved') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: Account approval pending admin verification.'
        });
    }

    next();
};
