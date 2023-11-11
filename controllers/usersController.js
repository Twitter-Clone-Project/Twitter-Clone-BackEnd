const { AppDataSource } = require('../dataSource');
const catchAsync = require('../middlewares/catchAsync');
const User = require('../models/entites/User');

exports.isUsernameFound = catchAsync(async (req, res, next) => {
  const { username } = req.params;

  const isFound = await AppDataSource.getRepository(User).exist({
    where: { username },
  });

  res.status(200).json({
    status: true,
    data: { isFound },
  });
});

exports.isEmailFound = catchAsync(async (req, res, next) => {
  const { email } = req.params;

  const isFound = await AppDataSource.getRepository(User).exist({
    where: { email },
  });

  res.status(200).json({
    status: true,
    data: { isFound },
  });
});
