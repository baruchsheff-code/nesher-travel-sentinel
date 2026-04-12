import { Bird, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NesherHeaderProps {
  showBack?: boolean;
  title?: string;
  rightContent?: React.ReactNode;
}

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
        <Bird className="text-primary shrink-0" size={24} strokeWidth={2.5} />
        <span className="text-primary font-bold text-lg truncate">
          {title || "Nesher"}
        </span>
      </div>
      {rightContent && <div className="flex items-center gap-1 shrink-0">{rightContent}</div>}
    </div>
  );
};

export default NesherHeader;
