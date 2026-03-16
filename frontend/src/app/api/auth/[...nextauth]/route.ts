import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  debug: process.env.NODE_ENV === 'development', // Only enable debug in development
  pages: {
    signIn: '/auth',
    error: '/auth', // Redirect errors back to auth page
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text", optional: true },
        isSignUp: { label: "Is Sign Up", type: "text", optional: true }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        try {
          if (credentials.isSignUp === "true") {
            // Sign up flow
            if (!credentials.name) {
              throw new Error("Name is required for sign up");
            }

            const signUpResponse = await fetch(`${apiUrl}/api/auth/signup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
                name: credentials.name
              }),
              // Add timeout to prevent hanging
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (!signUpResponse.ok) {
              const error = await signUpResponse.json();
              throw new Error(error.detail || "Sign up failed");
            }

            const user = await signUpResponse.json();
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
              image: user.image_url
            };
          } else {
            // Sign in flow
            const signInResponse = await fetch(`${apiUrl}/api/auth/signin`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password
              }),
              // Add timeout to prevent hanging
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (!signInResponse.ok) {
              const error = await signInResponse.json();
              throw new Error(error.detail || "Invalid credentials");
            }

            const user = await signInResponse.json();
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
              image: user.image_url
            };
          }
        } catch (error: any) {
          console.error("Auth error:", error.message);
          throw new Error(error.message || "Authentication failed");
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Simplified sign-in callback - remove heavy operations
      if (user.email) {
        // Only do basic user sync, don't wait for it to complete
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // Fire and forget - don't await this to speed up login
        fetch(`${apiUrl}/api/users/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user.email, 
            name: user.name || 'User',
            image_url: user.image 
          }),
          signal: AbortSignal.timeout(5000) // 5 second timeout
        }).catch(error => {
          console.error('Failed to sync user (non-blocking):', error);
        });
      }
      return true;
    },
    
    async jwt({ token, user, account }) {
      // Simplified JWT callback - remove heavy session tracking
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Simplified session callback
      if (token) {
        const user = (session.user ?? {}) as any;
        return {
          ...session,
          user: {
            ...user,
            id: token.id as string,
            email: token.email as string,
            name: token.name as string,
            image: token.image as string,
          },
        };
      }
      return session;
    }
  }
})

export { handler as GET, handler as POST }
