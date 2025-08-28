import axios from 'axios';
import { paymobConfig } from '../kashier_gateway/kashier.js';

let authToken = '';
let tokenExpiry = null;

export const authenticatePaymob = async () => {
  if (authToken && tokenExpiry > Date.now()) {
    return authToken;
  }

  try {
    const response = await axios.post(
      `${paymobConfig.baseUrl}/auth/tokens`,
      { api_key: paymobConfig.apiKey }
    );
    
    authToken = response.data.token;
    tokenExpiry = Date.now() + (55 * 60 * 1000); 
    
    return authToken;
  } catch (error) {
    console.error('Paymob authentication failed:', error.response?.data);
    throw new Error('Payment authentication failed');
  }
};