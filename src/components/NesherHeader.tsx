import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";

interface NesherHeaderProps {
  showBack?: boolean;
  title?: string;
  rightContent?: React.ReactNode;
}

const NesherLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path
      d="M4 18C5 14 8 10 12 8C14 7 17 6 20 6C20 9 19 12 17 15C15 18 12 20 8 20C6 20 4 19 4 18Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M12 8C10 10 8 14 8 20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M20 6C16 8 12 12 8 20"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
      opacity="0.5"
    />
  </svg>
);

const NesherHeader = ({ showBack = false, title, rightContent }: NesherHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="pt-6 px-4 flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-card transition-colors shrink-0">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
        )}
        <span className="text-primary"><NesherLogo /></span>
        <span className="text-primary font-bold text-lg truncate">
          {title || "Nesher"}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {rightContent}
        <ThemeToggle />
      </div>
    </div>
  );
};

export default NesherHeader;
