const Joi = require("joi");
const AppError = require("../utils/appError");

// Mock user database
let users = [
  { id: 1, name: "Alice", email: "alice@example.com", verified: true },
  { id: 2, name: "Bob", email: "bob@example.com", verified: false },
];

const userSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  verified: Joi.boolean().default(false),
});

exports.getAllUsers = (req, res) => {
  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users },
  });
};

exports.getUser = (req, res, next) => {
  const userId = Number.parseInt(req.params.id);
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { user },
  });
};

exports.createUser = (req, res) => {
  const newUser = {
    id: users.length + 1,
    ...req.body,
  };
  users.push(newUser);

  res.status(201).json({
    status: "success",
    data: { user: newUser },
  });
};

exports.updateUser = (req, res, next) => {
  const userId = Number.parseInt(req.params.id);
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return next(new AppError("No user found with that ID", 404));
  }

  users[userIndex] = { ...users[userIndex], ...req.body };

  res.status(200).json({
    status: "success",
    data: { user: users[userIndex] },
  });
};

exports.deleteUser = (req, res, next) => {
  const userId = Number.parseInt(req.params.id);
  const userExists = users.some((u) => u.id === userId);

  if (!userExists) {
    return next(new AppError("No user found with that ID", 404));
  }

  users = users.filter((u) => u.id !== userId);

  res.status(204).json({
    status: "success",
    data: null,
  });
};

exports.validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  next();
};
