import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "nesher_onboarding_done";

interface TooltipStep {
  target: string; // CSS selector
  text: string;
  position: "bottom" | "top";
}

const STEPS: TooltipStep[] = [
  {
    target: "[data-onboarding='search']",
    text: "Search in plain English — try 'flights to Israel next week'",
    position: "bottom",
  },
];

const RESULTS_STEPS: TooltipStep[] = [
  {
    target: "[data-onboarding='first-result']",
    text: "We check live safety conditions for every destination automatically",
    position: "bottom",
  },
  {
    target: "[data-onboarding='first-result']",
    text: "Create a free account to save this search and get price alerts",
    position: "bottom",
  },
];

export const useOnboarding = () => {
  const [done, setDone] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDone(true);
  };
  return { done, dismiss };
};

export const OnboardingTooltip = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onDismiss,
}: {
  step: TooltipStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onDismiss: () => void;
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = document.querySelector(step.target);
    if (el) {
      setRect(el.getBoundingClientRect());
    }
  }, [step.target]);

  if (!rect) return null;

  const top = step.position === "bottom" ? rect.bottom + 12 : rect.top - 12;

  return (
    <div className="fixed inset-0 z-[90]" onClick={onDismiss}>
      <div className="absolute inset-0 bg-foreground/20" />
      <div
        className="absolute left-4 right-4 rounded-2xl p-4 shadow-lg animate-fade-in"
        style={{
          top,
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--primary) / 0.3)",
          maxWidth: 360,
          transform: step.position === "top" ? "translateY(-100%)" : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onDismiss} className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted">
          <X size={14} className="text-muted-foreground" />
        </button>
        <p className="text-sm text-foreground pr-6">{step.text}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] text-muted-foreground">{currentStep}/{totalSteps}</span>
          <button
            onClick={onNext}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground"
          >
            {currentStep === totalSteps ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const HomeOnboarding = () => {
  const { done, dismiss } = useOnboarding();
  const [step, setStep] = useState(0);

  if (done || step >= STEPS.length) return null;

  return (
    <OnboardingTooltip
      step={STEPS[step]}
      currentStep={step + 1}
      totalSteps={3}
      onNext={() => {
        if (step + 1 >= STEPS.length) dismiss();
        else setStep(step + 1);
      }}
      onDismiss={dismiss}
    />
  );
};

export const ResultsOnboarding = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const { done, dismiss } = useOnboarding();
  const [step, setStep] = useState(0);
  const hasSearched = localStorage.getItem("nesher_first_search") === "true";

  useEffect(() => {
    localStorage.setItem("nesher_first_search", "true");
  }, []);

  if (done || !hasSearched) return null;

  const steps = isLoggedIn ? [RESULTS_STEPS[0]] : RESULTS_STEPS;
  if (step >= steps.length) return null;

  return (
    <OnboardingTooltip
      step={steps[step]}
      currentStep={step + 2}
      totalSteps={3}
      onNext={() => {
        if (step + 1 >= steps.length) dismiss();
        else setStep(step + 1);
      }}
      onDismiss={dismiss}
    />
  );
};
