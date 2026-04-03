const axios = require('axios');

/**
 * Verify reCAPTCHA v3 or hCaptcha token
 * Optional: if no CAPTCHA_SECRET env var is set, middleware skips verification
 */
module.exports = async (req, res, next) => {
  const captchaSecret = process.env.CAPTCHA_SECRET || process.env.RECAPTCHA_SECRET_KEY;
  
  // Skip if not configured
  if (!captchaSecret) {
    return next();
  }

  const token = req.body.captchaToken || req.headers['x-captcha-token'];

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'captchaToken is required'
    });
  }

  try {
    const captchaProvider = process.env.CAPTCHA_PROVIDER || 'recaptcha';
    let isValid = false;

    if (captchaProvider === 'hcaptcha') {
      const hcaptchaUrl = 'https://hcaptcha.com/siteverify';
      const response = await axios.post(hcaptchaUrl, null, {
        params: {
          secret: captchaSecret,
          response: token
        }
      });
      isValid = response.data.success && (response.data.score > 0.3 || !response.data.score);
    } else {
      // Default: reCAPTCHA v3
      const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
      const response = await axios.post(recaptchaUrl, null, {
        params: {
          secret: captchaSecret,
          response: token
        }
      });
      // reCAPTCHA v3 score: 0.0 to 1.0 (higher = more likely legitimate)
      isValid = response.data.success && response.data.score > 0.3;
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA verification failed. Please try again.'
      });
    }

    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('CAPTCHA verification error:', error.message);
    // Fail open for now (don't block on network error)
    next();
  }
};
