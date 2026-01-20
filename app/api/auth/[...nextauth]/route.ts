import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import type { UserRole } from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectToDatabase();

        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
          provider: "credentials",
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error("Invalid email or password");
        }

        return {
          id: (user._id as any).toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "user" as UserRole,
        };
      },
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          role: "user" as UserRole,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        await connectToDatabase();

        // Check if email already exists with ANY provider
        const existingUser = await User.findOne({ email: user.email });

        if (existingUser) {
          // If user exists with same provider, just update and allow login
          if (existingUser.provider === account.provider && 
              existingUser.providerId === account.providerAccountId) {
            await User.findOneAndUpdate(
              { _id: existingUser._id },
              {
                name: user.name,
                email: user.email,
              }
            );
            return true;
          }

          // If user exists with different provider
          if (existingUser.provider !== account.provider) {
            // Check if this OAuth provider is already linked
            const isAlreadyLinked = existingUser.linkedAccounts?.some(
              (acc: any) => acc.provider === account.provider && acc.providerId === account.providerAccountId
            );

            if (isAlreadyLinked) {
              return true; // Already linked, allow sign in
            }

            // Show clear message about which provider to use
            const providerName = existingUser.provider === 'credentials' ? 'email and password' : existingUser.provider;
            throw new Error(
              `This email is already registered with ${providerName}. Please use ${providerName} to login.`
            );
          }
        } else {
          // No existing user, create new one with auto-approval for OAuth
          await User.create({
            name: user.name,
            email: user.email,
            provider: account.provider,
            providerId: account.providerAccountId,
            role: "user",
            accountStatus: "approved", // OAuth users are auto-approved
            emailVerified: true,
            linkedAccounts: [{
              provider: account.provider,
              providerId: account.providerAccountId,
            }],
          });
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Always fetch the latest role from database to ensure it's up-to-date
      if (token.email) {
        await connectToDatabase();
        
        // Try to find user by email first (handles linked accounts)
        let dbUser = await User.findOne({ email: token.email });
        
        // If not found by email and it's an OAuth login, try by provider
        if (!dbUser && account?.provider !== "credentials") {
          dbUser = await User.findOne({
            provider: account?.provider,
            providerId: account?.providerAccountId,
          });
        }

        if (dbUser) {
          token.id = (dbUser._id as any).toString();
          token.role = dbUser.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }

      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
