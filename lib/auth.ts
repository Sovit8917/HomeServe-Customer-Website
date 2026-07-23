import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

/**
 * IMPORTANT: this instance manages login state for the WEBSITE ONLY
 * (Google OAuth + email/password). It intentionally shares the same
 * `User` table as the NestJS backend/mobile app (phone-OTP login) so a
 * customer's bookings/wallet/subscriptions match up across mobile and
 * web — Better Auth's built-in account-linking-by-verified-email
 * handles this: if someone signs in with Google using an email that
 * already exists on a phone-registered account, it links to that same
 * row instead of creating a duplicate.
 *
 * This does NOT replace calling the NestJS backend for actual app data —
 * see app/api/auth/backend-token/route.ts, which exchanges a valid
 * Better Auth session for a NestJS-compatible JWT so the rest of the
 * site keeps working exactly as it did with phone-OTP login.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL,

  user: {
    // Map Better Auth's internal "image" field onto our existing
    // `avatar` column instead of adding a redundant duplicate column.
    fields: { image: 'avatar' },
  },

  emailAndPassword: {
    enabled: true,
    // Keep this on so a stolen/rotated table can't be used to enumerate
    // whether an email is registered without ever confirming a password.
    requireEmailVerification: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      // Google verifies the email on its side, so it's safe to trust it
      // for linking to an existing phone-registered account by email —
      // this is what makes "same account as mobile app" actually work.
      trustedProviders: ['google'],
    },
  },
});
