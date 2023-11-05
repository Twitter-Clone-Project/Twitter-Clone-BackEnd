module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next); //==== catch(er=>next(er))
};
