import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { TimerSettingsProvider } from "../context/TimerSettingsContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <TimerSettingsProvider>{children}</TimerSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
