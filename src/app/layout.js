import { GoogleOAuthProvider } from "@react-oauth/google";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

export default function RootLayout({ children }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      <html lang="en">
        <body>
          <ToastProvider />
          {children}
        </body>
      </html>
    </GoogleOAuthProvider>
  );
}