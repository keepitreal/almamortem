interface CheckmarkCircleProps {
  className?: string;
}

export const CheckmarkCircle: React.FC<CheckmarkCircleProps> = ({
  className,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="12" cy="12" r="10" />
      <path
        d="M8 12.5L10.5 15L16 9"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
