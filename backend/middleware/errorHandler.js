export const errorHandler = (err, req, res, next) => {
    console.error('💥 Unhandled Server Error:', err);
    
    const statusCode = err.status || err.statusCode || 500;
    
    const errorResponse = {
        success: false,
        message: err.message || 'Internal Server Error'
    };

    // If there are detailed validation/sub-errors, append them
    if (err.errors) {
        errorResponse.errors = err.errors;
    } else if (err.name === 'ValidationError') {
        // Handle Mongoose Validation Error
        errorResponse.errors = Object.keys(err.errors).reduce((acc, key) => {
            acc[key] = err.errors[key].message;
            return acc;
        }, {});
        errorResponse.message = 'Validation Error';
    }

    res.status(statusCode).json(errorResponse);
};
