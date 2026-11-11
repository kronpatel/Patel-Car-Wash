import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/jsonDb";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Patel car'spa & Detailing Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const user = findUserByEmail(credentials.email);

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isPasswordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordMatch) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          cleanCoins: user.cleanCoins,
          referralCode: user.referralCode,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.cleanCoins = user.cleanCoins;
        token.referralCode = user.referralCode;
      }

      // Handle session updates (e.g. coin balance update)
      if (trigger === "update" && session) {
        if (typeof session.cleanCoins === "number") {
          token.cleanCoins = session.cleanCoins;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.phone = token.phone as string;
        session.user.cleanCoins = token.cleanCoins as number;
        session.user.referralCode = token.referralCode as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "cleanpro_super_secure_jwt_secret_change_me_in_prod_123456789",
};
