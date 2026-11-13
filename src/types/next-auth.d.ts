import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
import { UserRole } from "./index";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: UserRole;
    phone?: string;
    mobile?: string;
    cleanCoins?: number;
    referralCode?: string;
    type?: "user" | "staff";
    staffId?: string;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      phone?: string;
      mobile?: string;
      cleanCoins?: number;
      referralCode?: string;
      type?: "user" | "staff";
      staffId?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    phone?: string;
    mobile?: string;
    cleanCoins?: number;
    referralCode?: string;
    type?: "user" | "staff";
    staffId?: string;
  }
}
