import { generate_token } from "../security/token.js";

export const login_Credentials = (user, res) => {
  // Determine token type based on role and permissions
  const isSystemUser = user.role === 'admin' && user.permissions?.includes('create_products');
  const tokenType = isSystemUser ? 'System' : 'Bearer';
  
  // Token secrets configuration
  const tokenConfig = {
    access: {
      secret: tokenType === 'System' 
        ? process.env.ACCESS_SYSTEM_TOKEN_SECRET
        : process.env.ACCESS_USER_TOKEN_SECRET,
      options: {}
    },
    refresh: {
      secret: tokenType === 'System'
        ? process.env.REFRESH_SYSTEM_TOKEN_SECRET
        : process.env.REFRESH_USER_TOKEN_SECRET,
      options: { expiresIn: '7d' }
    }
  };

  // Token payload with enhanced claims
  const tokenPayload = { 
    id: user._id.toString(),
    role: user.role,
    isSystem: tokenType === 'System',
    permissions: user.permissions || []
  };

  // Generate tokens
  const tokens = {
    access_token: generate_token(tokenPayload, tokenConfig.access.secret, tokenConfig.access.options),
    refresh_token: generate_token(tokenPayload, tokenConfig.refresh.secret, tokenConfig.refresh.options),
    token_type: tokenType
  };

  // Secure cookie settings
  if (res) {
    res.cookie('refresh_token', tokens.refresh_token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }

  return tokens;
};