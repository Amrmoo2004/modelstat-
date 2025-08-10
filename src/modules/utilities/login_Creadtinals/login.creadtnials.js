import { generate_token } from "../security/token.js";

export const login_Credentials = (user, res, tokenType) => { // Add tokenType parameter
  const tokenConfig = {
    access: {
      secret: tokenType === 'System' 
        ? process.env.ACCESS_SYSTEM_TOKEN_SECRET
        : process.env.ACCESS_USER_TOKEN_SECRET,
      options: { expiresIn: '30m' } // Fixed: Added 'm' for minutes
    },
    refresh: {
      secret: tokenType === 'System'
        ? process.env.REFRESH_SYSTEM_TOKEN_SECRET
        : process.env.REFRESH_USER_TOKEN_SECRET,
      options: { expiresIn: '7d' }
    }
  };

  const tokenPayload = { 
    id: user._id.toString(),
    role: user.role,
    // Add any additional claims here
  };

  const tokens = {
    access_token: generate_token(tokenPayload, tokenConfig.access.secret, tokenConfig.access.options),
    refresh_token: generate_token(tokenPayload, tokenConfig.refresh.secret, tokenConfig.refresh.options),
    token_type: tokenType
  };

  if (res) {
    res.cookie('refresh_token', tokens.refresh_token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  return tokens;
};