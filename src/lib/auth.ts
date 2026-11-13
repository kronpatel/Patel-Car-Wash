import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types";

const credentialsProvider =
  typeof CredentialsProvider === "function"
    ? CredentialsProvider
    : (CredentialsProvider as any).default;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    credentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email or Mobile", type: "text", placeholder: "you@example.com or 9876543210" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email/Mobile and password required");
        }

        const identifier = credentials.email.trim();
        const normalizedEmail = identifier.toLowerCase();
        const cleanMobile = identifier.replace(/[\s\-\+]/g, "").replace(/^91/, "");

        // ─── 1. Check User table (Admin / Customer) ───
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: normalizedEmail },
              { email: identifier },
              { phone: identifier },
              ...(cleanMobile ? [{ phone: cleanMobile }] : []),
            ],
          },
        });

        if (user) {
          if (!user.password) {
            throw new Error("Invalid email or password");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) throw new Error("Invalid email or password");

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role as UserRole,
            type: "user",
            cleanCoins: user.cleanCoins,
            referralCode: user.referralCode,
          };
        }

        // ─── 2. Check Staff table (Employee) ───
        const staff = await prisma.staff.findFirst({
          where: {
            OR: [
              { email: normalizedEmail },
              { email: identifier },
              { mobile: identifier },
              ...(cleanMobile ? [{ mobile: cleanMobile }] : []),
            ],
          },
        });

        if (staff) {
          if (staff.status !== "ACTIVE") {
            throw new Error("Your account is inactive. Contact admin.");
          }

          const isValid = await bcrypt.compare(credentials.password, staff.password);
          if (!isValid) throw new Error("Invalid credentials");

          return {
            id: staff.id,
            name: staff.name,
            email: staff.email,
            phone: staff.mobile,
            mobile: staff.mobile,
            role: "staff" as UserRole,
            type: "staff",
            staffId: staff.staffId,
            cleanCoins: 0,
            referralCode: "",
          };
        }

        throw new Error("No account found with these credentials");
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
        token.type = user.type;
        token.staffId = user.staffId;
        token.mobile = user.mobile;
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
        session.user.role = token.role as UserRole;
        session.user.phone = token.phone as string;
        session.user.cleanCoins = token.cleanCoins as number;
        session.user.referralCode = token.referralCode as string;
        session.user.type = token.type;
        if (token.staffId) session.user.staffId = token.staffId;
        if (token.mobile) session.user.mobile = token.mobile;
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
