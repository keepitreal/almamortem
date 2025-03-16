export const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-100/80">
      <div className="flex flex-col items-center gap-4">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    </div>
  );
};
