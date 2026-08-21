import { ThemeProvider } from "@/components/ThemeProvider/ThemeProvider";
import { UserProfileProvider } from "@/components/UserProfileContext";
import "../globals.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <ThemeProvider>
        <UserProfileProvider>{children}</UserProfileProvider>
      </ThemeProvider>
    </div>
  );
}
