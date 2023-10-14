const sendErrorProd = (err, req, res) => {};

const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  //production error handling
  if (process.env.NODE_ENV.trim() == 'production') {
    let error = Object.assign(err);
    // error.message = err.message;

    sendErrorProd(error, req, res);

    //development error handling
  } else if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  }
};
