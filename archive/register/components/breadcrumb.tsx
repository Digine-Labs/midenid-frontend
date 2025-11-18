import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";

interface BreadcrumbProps {
  currentStep: "domain" | "checkout" | "done";
}

export function Breadcrumb({ currentStep }: BreadcrumbProps) {
  const navigate = useNavigate();

  const steps = [
    { id: "domain", label: "Domain" },
    { id: "checkout", label: "Checkout" },
    { id: "done", label: "Done" },
  ] as const;

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  const handleDomainClick = () => {
    if (currentStep !== "domain") {
      navigate("/");
    }
  };

  return (
    <nav aria-label="Registration progress" className="mb-6">
      <ol className="flex items-center justify-center gap-2 text-xs sm:text-xs">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isPast = index < currentStepIndex;
          const isClickable = step.id === "domain" && currentStep !== "domain";

          return (
            <li key={step.id} className="flex items-center gap-2">
              <button
                onClick={isClickable ? handleDomainClick : undefined}
                disabled={!isClickable}
                className={`
                  ${isActive ? "text-primary font-semibold" : ""}
                  ${isPast ? "text-muted-foreground" : ""}
                  ${!isActive && !isPast ? "text-muted-foreground/60" : ""}
                  ${isClickable ? "hover:text-primary cursor-pointer transition-colors" : "cursor-default"}
                `}
              >
                {step.label}
              </button>
              {index < steps.length - 1 && (
                <ChevronRight
                  className="w-4 h-4 text-muted-foreground/60"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
