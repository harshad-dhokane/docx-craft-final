import { createCookieSessionStorage } from "@remix-run/node";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in your environment variables.");
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session", // use any name you want
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production", // enable this in prod
  },
});

// Helper function to get session from request
export function getUserSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}
