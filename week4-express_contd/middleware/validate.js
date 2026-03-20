const AppError = require("../utils/appError");

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const message = error.details.map((el) => el.message).join(", ");
      return next(new AppError(message, 400));
    }
    next();
  };
};

module.exports = validate;
