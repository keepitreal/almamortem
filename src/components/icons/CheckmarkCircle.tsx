import React from "react";

interface CheckmarkCircleProps {
  className?: string;
}

export const CheckmarkCircle: React.FC<CheckmarkCircleProps> = ({
  className,
}) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="11"
        fill="#EF4444"
        fillOpacity="0.9"
        stroke="#EF4444"
      />
      <path
        d="M7 12.5L10.5 16L17 9"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
