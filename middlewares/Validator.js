const Joi = require("joi");

exports.validateOrder = (req, res, next) => {
  const orderSchema = Joi.object({
    name: Joi.string().trim().min(3).required(),
    email: Joi.string().email().required(),
    phone: Joi.string()
      .pattern(/^(\+92|0)?3[0-9]{9}$/)
      .required(),
    shippingAddress: Joi.string().min(15).required(),
    products: Joi.array().min(1).required(),
  });

  exports.validateOrder = (req, res, next) => {
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message.replace(/"/g, ""), // Clean error message
      });
    }
    next();
  };
};
