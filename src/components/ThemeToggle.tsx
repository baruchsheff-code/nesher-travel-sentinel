import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center rounded-full transition-all duration-300"
      style={{
        width: 40,
        height: 40,
        backgroundColor: theme === "dark" ? "#1A2332" : "#F3F4F6",
        border: theme === "dark" ? "1px solid rgba(201, 168, 76, 0.3)" : "1px solid #E5E7EB",
      }}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon size={18} style={{ color: "#1A2332" }} />
      ) : (
        <Sun size={18} style={{ color: "#C9A84C" }} />
      )}
    </button>
  );
};

export default ThemeToggle;
