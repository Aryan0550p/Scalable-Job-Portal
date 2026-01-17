const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  full_name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('job_seeker', 'recruiter').required(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
  company_name: Joi.string().when('role', {
    is: 'recruiter',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ errors });
    }

    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  validate,
};
