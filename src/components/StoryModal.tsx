import { useEffect, useState } from "react";

export const StoryModal = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hasSeenStory = localStorage.getItem("story-3172025");
    if (hasSeenStory) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("story-3172025", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
      <div className="mx-4 w-full max-w-[1500px] rounded-lg shadow-xl">
        <div className="flex flex-row justify-between gap-1">
          {/* Panel 1 */}
          <div className="relative">
            <div className="h-[600px] w-[500px] border-[10px] border-white">
              <img
                src="/images/stories/3172025/1.png"
                alt="Story panel 1"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded bg-base-100 p-3 text-center text-sm shadow-lg">
              On March 16th, 2025, the National Coalition for Armament
              Advancement (NCAA) selected 64 super soldiers to compete for the
              Palmer Prize, a coveted grant from the US Government.
            </div>
          </div>

          {/* Panel 2 */}
          <div className="relative">
            <div className="h-[600px] w-[500px] border-[10px] border-white">
              <img
                src="/images/stories/3172025/2.png"
                alt="Story panel 2"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded bg-base-100 p-3 text-center text-sm shadow-lg">
              Universities across the United States have redirected their
              research budgets to the development of these super soldiers.
            </div>
          </div>

          {/* Panel 3 */}
          <div className="relative">
            <div className="h-[600px] w-[500px] border-[10px] border-white">
              <img
                src="/images/stories/3172025/3.png"
                alt="Story panel 3"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded bg-base-100 p-3 text-center text-sm shadow-lg">
              The winner of the Palmer Prize will represent the US in proxy
              battles that decide the outcome of conflicts with rival nations.
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="btn btn-lg my-12 mt-6 border-red-600 bg-red-600"
      >
        Build Your Bracket
      </button>
    </div>
  );
};
