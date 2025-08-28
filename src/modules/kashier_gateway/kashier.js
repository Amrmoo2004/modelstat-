// config/paymob.js
export const paymobConfig = {
  apiKey: process.env.PAYMOB_API_KEY,
  integrationId: process.env.PAYMOB_INTEGRATION_ID,
  iframeId: process.env.PAYMOB_IFRAME_ID,
  hmacSecret: process.env.PAYMOB_HMAC_SECRET,
  baseUrl: 'https://accept.paymob.com/api',
  currency: 'EGP'
};