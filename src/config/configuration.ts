export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3001',
  },
});
