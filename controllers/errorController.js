const sendErrorProd = (err, req, res) => {};

const sendErrorDev = (err, req, res) =>
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack,
    });

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV.trim() === 'production') {
        const error = Object.assign(err);
        error.message = err.message;

        sendErrorProd(error, req, res);
    } else if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    }
};
