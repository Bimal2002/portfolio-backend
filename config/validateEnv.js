const Joi = require('joi');

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(5000),
  CLIENT_URL: Joi.string().uri().optional(),
  FRONTEND_URL: Joi.string().uri().optional(),

  // Database
  MONGODB_URI: Joi.string().required(),

  // Auth
  JWT_SECRET: Joi.string().min(6).required(),
  JWT_EXPIRE: Joi.string().optional(),

  // Email
  EMAIL_USER: Joi.string().email().optional(),
  EMAIL_PASSWORD: Joi.string().optional(),
  EMAIL_FROM: Joi.string().email().optional(),
  API_BASE_URL: Joi.string().uri().optional(),

  // Cloudinary (optional)
  CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
  CLOUDINARY_API_KEY: Joi.string().optional(),
  CLOUDINARY_API_SECRET: Joi.string().optional(),

  // Google Calendar (optional)
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),
  GOOGLE_REDIRECT_URI: Joi.string().uri().optional(),
  GOOGLE_REFRESH_TOKEN: Joi.string().optional()
}).unknown(true);

function validate() {
  const { error } = schema.validate(process.env);
  if (error) {
    throw new Error(error.details.map(d => d.message).join(', '));
  }
}

module.exports = { validate };
