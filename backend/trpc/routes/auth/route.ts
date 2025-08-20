import { z } from "zod";
import { publicProcedure } from "../../create-context";
// Error classes
class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const authRegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional()
});

const authLoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const authUpdateProfileInputSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().optional() // Can be base64 or URL
});

const authUpdateEmailInputSchema = z.object({
  newEmail: z.string().email(),
  password: z.string().min(1)
});

const authUpdatePasswordInputSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

const authDeleteAccountInputSchema = z.object({
  password: z.string().min(1)
});

// Mock user data
let mockUser = {
  id: "user_demo_123",
  email: "demo@flaneur.app",
  displayName: "Demo User",
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  plan: "platinum" as const,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  updatedAt: new Date().toISOString()
};

let mockSession = {
  isAuthenticated: true,
  userId: mockUser.id,
  sessionToken: "mock_session_token_123",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
};

export const authRegisterProcedure = publicProcedure
  .input(authRegisterInputSchema)
  .mutation(async ({ input }) => {
    console.log("[Auth] Registering new user:", { email: input.email, displayName: input.displayName });
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      console.log("[Auth] DRY_RUN mode - simulating user registration");
      
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: input.email,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl || null,
        plan: "free" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const session = {
        isAuthenticated: true,
        userId: newUser.id,
        sessionToken: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      return {
        success: true,
        message: "Account created successfully (DRY_RUN mode)",
        user: newUser,
        session
      };
    }
    
    // In LIVE mode, this would:
    // 1. Hash password with argon2id
    // 2. Create user in database
    // 3. Create workspace
    // 4. Generate JWT/session
    
    throw new Error("LIVE registration not implemented - set DRY_RUN=true for demo mode");
  });

export const authLoginProcedure = publicProcedure
  .input(authLoginInputSchema)
  .mutation(async ({ input }) => {
    console.log("[Auth] User login attempt:", { email: input.email });
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      console.log("[Auth] DRY_RUN mode - simulating successful login");
      
      // Simulate password check
      if (input.password.length < 4) {
        throw new AuthError("Invalid email or password");
      }
      
      return {
        success: true,
        message: "Login successful (DRY_RUN mode)",
        user: mockUser,
        session: mockSession
      };
    }
    
    // In LIVE mode, this would verify password and create session
    throw new Error("LIVE login not implemented - set DRY_RUN=true for demo mode");
  });

export const authLogoutProcedure = publicProcedure
  .mutation(async () => {
    console.log("[Auth] User logout");
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      console.log("[Auth] DRY_RUN mode - simulating logout");
      
      mockSession.isAuthenticated = false;
      mockSession.sessionToken = "";
      
      return {
        success: true,
        message: "Logged out successfully (DRY_RUN mode)"
      };
    }
    
    // In LIVE mode, this would invalidate session/JWT
    throw new Error("LIVE logout not implemented - set DRY_RUN=true for demo mode");
  });

export const authMeProcedure = publicProcedure
  .query(async () => {
    console.log("[Auth] Fetching current user");
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      // Always return authenticated user in demo mode
      return {
        success: true,
        user: mockUser,
        session: mockSession
      };
    }
    
    // In LIVE mode, this would verify JWT/session and return user
    // For now, return demo user to prevent undefined errors
    return {
      success: true,
      user: mockUser,
      session: mockSession
    };
  });

export const authUpdateProfileProcedure = publicProcedure
  .input(authUpdateProfileInputSchema)
  .mutation(async ({ input }) => {
    console.log("[Auth] Updating user profile:", input);
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      console.log("[Auth] DRY_RUN mode - simulating profile update");
      
      if (input.displayName) {
        mockUser.displayName = input.displayName;
      }
      
      if (input.avatarUrl !== undefined) {
        mockUser.avatarUrl = input.avatarUrl;
      }
      
      mockUser.updatedAt = new Date().toISOString();
      
      return {
        success: true,
        message: "Profile updated successfully (DRY_RUN mode)",
        user: mockUser
      };
    }
    
    // In LIVE mode, this would update user in database
    throw new Error("LIVE profile update not implemented - set DRY_RUN=true for demo mode");
  });

export const authUpdateEmailProcedure = publicProcedure
  .input(authUpdateEmailInputSchema)
  .mutation(async ({ input }) => {
    console.log("[Auth] Updating user email:", { newEmail: input.newEmail });
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      console.log("[Auth] DRY_RUN mode - simulating email update");
      
      // Simulate password verification
      if (input.password.length < 4) {
        throw new AuthError("Invalid password");
      }
      
      mockUser.email = input.newEmail;
      mockUser.updatedAt = new Date().toISOString();
      
      return {
        success: true,
        message: "Email updated successfully (DRY_RUN mode)",
        user: mockUser
      };
    }
    
    // In LIVE mode, this would verify password and update email
    throw new Error("LIVE email update not implemented - set DRY_RUN=true for demo mode");
  });

export const authUpdatePasswordProcedure = publicProcedure
  .input(authUpdatePasswordInputSchema)
  .mutation(async ({ input }) => {
    console.log("[Auth] Updating user password");
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      console.log("[Auth] DRY_RUN mode - simulating password update");
      
      // Simulate old password verification
      if (input.oldPassword.length < 4) {
        throw new AuthError("Current password is incorrect");
      }
      
      if (input.newPassword.length < 8) {
        throw new ValidationError("New password must be at least 8 characters long", "newPassword");
      }
      
      mockUser.updatedAt = new Date().toISOString();
      
      return {
        success: true,
        message: "Password updated successfully (DRY_RUN mode)"
      };
    }
    
    // In LIVE mode, this would verify old password and hash new one
    throw new Error("LIVE password update not implemented - set DRY_RUN=true for demo mode");
  });

export const authDeleteAccountProcedure = publicProcedure
  .input(authDeleteAccountInputSchema)
  .mutation(async ({ input }) => {
    console.log("[Auth] Deleting user account");
    
    const isDryRun = process.env.DRY_RUN === "true" || process.env.DRY_RUN === "1";
    
    if (isDryRun) {
      console.log("[Auth] DRY_RUN mode - simulating account deletion");
      
      // Simulate password verification
      if (input.password.length < 4) {
        throw new AuthError("Password is incorrect");
      }
      
      // Reset mock session
      mockSession.isAuthenticated = false;
      mockSession.sessionToken = "";
      
      return {
        success: true,
        message: "Account deleted successfully (DRY_RUN mode)"
      };
    }
    
    // In LIVE mode, this would:
    // 1. Verify password
    // 2. Revoke all OAuth tokens
    // 3. Delete workspace and all data
    // 4. Delete user account
    // 5. Invalidate all sessions
    
    throw new Error("LIVE account deletion not implemented - set DRY_RUN=true for demo mode");
  });