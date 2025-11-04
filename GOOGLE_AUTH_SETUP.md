# Google OAuth Authentication Setup

This guide explains how to set up and use Google OAuth authentication in this NestJS API.

## Features

- Google OAuth 2.0 authentication
- JWT-based session management
- Protected routes with authentication guards
- In-memory user storage (replace with database in production)

## Prerequisites

1. A Google Cloud Project with OAuth 2.0 credentials
2. Node.js and npm installed

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if you haven't already
6. For Application type, select **Web application**
7. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (for local development)
8. Save and copy your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Update the `.env` file with your Google OAuth credentials:

```bash
# Server Configuration
PORT=3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# Frontend URL (for redirects after authentication)
FRONTEND_URL=http://localhost:3001
```

**Important:** Generate a strong, random JWT secret for production environments.

### 3. Install Dependencies

Dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

### 4. Start the Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication Endpoints

#### `GET /auth/google`
Initiates the Google OAuth flow. Redirect users to this endpoint to start authentication.

**Example:**
```
http://localhost:3000/auth/google
```

#### `GET /auth/google/callback`
OAuth callback endpoint. Google redirects here after user authorization.
This endpoint automatically generates a JWT token and redirects to your frontend with the token.

**Redirect format:**
```
${FRONTEND_URL}/auth/callback?token=${access_token}
```

#### `GET /auth/me`
Returns the current authenticated user's profile. Requires JWT token.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "id": "user_1234567890_abc123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "googleId": "1234567890",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Protected Endpoints

#### `GET /profile`
Example protected route that requires authentication.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "message": "This is a protected route",
  "user": {
    "id": "user_1234567890_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

## Frontend Integration

### 1. Initiate OAuth Flow

From your frontend, redirect users to the Google OAuth endpoint:

```javascript
// React example
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:3000/auth/google';
};
```

### 2. Handle OAuth Callback

Create a callback page to receive the JWT token:

```javascript
// React example - /auth/callback page
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Store token in localStorage or secure cookie
      localStorage.setItem('access_token', token);
      // Redirect to dashboard or home
      navigate('/dashboard');
    }
  }, [searchParams, navigate]);

  return <div>Authenticating...</div>;
}
```

### 3. Make Authenticated Requests

Include the JWT token in the Authorization header:

```javascript
// React example with fetch
const fetchProfile = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch('http://localhost:3000/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data;
};

// Or with axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Use it
const profile = await api.get('/profile');
```

## Protecting Your Routes

To protect any route in your NestJS application:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { User } from './users/user.entity';

@Controller('example')
export class ExampleController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtectedData(@CurrentUser() user: User) {
    return {
      message: 'This data is only accessible to authenticated users',
      userId: user.id,
    };
  }
}
```

## Project Structure

```
src/
├── auth/
│   ├── decorators/
│   │   └── current-user.decorator.ts   # Decorator to get current user
│   ├── guards/
│   │   └── jwt-auth.guard.ts           # JWT authentication guard
│   ├── strategies/
│   │   ├── google.strategy.ts          # Google OAuth strategy
│   │   └── jwt.strategy.ts             # JWT validation strategy
│   ├── auth.controller.ts              # Auth endpoints
│   ├── auth.module.ts                  # Auth module configuration
│   └── auth.service.ts                 # Auth business logic
├── config/
│   └── configuration.ts                # Environment configuration
├── users/
│   ├── user.entity.ts                  # User interface
│   ├── users.module.ts                 # Users module
│   └── users.service.ts                # User management service
└── app.module.ts                       # Root application module
```

## Important Notes

### Security Considerations

1. **JWT Secret:** Change the `JWT_SECRET` in production to a strong, random value
2. **HTTPS:** Always use HTTPS in production
3. **CORS:** Configure CORS properly for your frontend domain
4. **Database:** Replace in-memory storage with a real database (PostgreSQL, MongoDB, etc.)
5. **Token Storage:** Store tokens securely (httpOnly cookies recommended for web apps)

### Production Deployment

Before deploying to production:

1. Update `GOOGLE_CALLBACK_URL` to your production domain
2. Add production callback URL to Google OAuth credentials
3. Set up a real database for user persistence
4. Use environment-specific `.env` files
5. Enable HTTPS
6. Configure proper CORS policies
7. Add rate limiting and security middleware

### Database Integration

The current implementation uses in-memory storage. To integrate a database:

1. Install database package (e.g., `@nestjs/typeorm`, `@prisma/client`)
2. Update `user.entity.ts` to use database decorators
3. Modify `users.service.ts` to use database operations
4. Add database configuration to `app.module.ts`

Example with TypeORM:

```bash
npm install @nestjs/typeorm typeorm pg
```

```typescript
// user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  picture?: string;

  @Column({ unique: true })
  googleId: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

## Testing the Implementation

### Using cURL

1. Get the auth URL and open in browser:
```bash
open http://localhost:3000/auth/google
```

2. After authentication, you'll be redirected with a token. Extract it and test:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3000/profile
```

### Using Postman

1. Create a GET request to `http://localhost:3000/auth/google`
2. Follow the OAuth flow in the browser
3. Copy the token from the redirect URL
4. Create a new GET request to `http://localhost:3000/profile`
5. Add Authorization header: `Bearer YOUR_TOKEN_HERE`

## Troubleshooting

### "Error: Invalid credentials"
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Verify credentials are from the same Google Cloud project

### "Redirect URI mismatch"
- Ensure `GOOGLE_CALLBACK_URL` in `.env` matches the authorized redirect URI in Google Console
- Check for trailing slashes - they must match exactly

### "Unauthorized" on protected routes
- Verify the JWT token is included in the Authorization header
- Check that the token hasn't expired (default is 7 days)
- Ensure the JWT_SECRET matches between token creation and validation

### CORS errors from frontend
- Add CORS configuration in `main.ts`:
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

## Additional Resources

- [NestJS Authentication Documentation](https://docs.nestjs.com/security/authentication)
- [Passport.js Documentation](http://www.passportjs.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [JWT.io](https://jwt.io/) - Debug JWT tokens
