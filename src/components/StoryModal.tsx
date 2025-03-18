import { useEffect, useState } from "react";

const DESKTOP_MIN_WIDTH = 1024; // Same breakpoint as build.tsx

export const StoryModal = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);
  const [currentPanel, setCurrentPanel] = useState(0);

  useEffect(() => {
    const hasSeenStory = localStorage.getItem("story-3172025");
    if (hasSeenStory) {
      setIsVisible(false);
    }

    // Check initial screen size
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_MIN_WIDTH);
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("story-3172025", "true");
    setIsVisible(false);
  };

  const handleNext = () => {
    setCurrentPanel((prev) => Math.min(prev + 1, 2));
  };

  const handlePrev = () => {
    setCurrentPanel((prev) => Math.max(prev - 1, 0));
  };

  if (!isVisible) return null;

  const panels = [
    {
      image: "/images/stories/3172025/1.png",
      text: "On March 16th, 2025, the National Coalition for Armament Advancement (NCAA) selected 64 super soldiers to compete for the Palmer Prize, a coveted grant from the US Government.",
    },
    {
      image: "/images/stories/3172025/2.png",
      text: "Universities across the United States have redirected their research budgets to the development of these super soldiers.",
    },
    {
      image: "/images/stories/3172025/3.png",
      text: "The winner of the Palmer Prize will represent the US in proxy battles that decide the outcome of conflicts with rival nations.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
      <div className="mx-4 w-full max-w-[1500px] rounded-lg shadow-xl">
        {isDesktop ? (
          // Desktop layout - show all panels
          <div className="flex flex-row justify-between gap-1">
            {panels.map((panel, index) => (
              <div key={index} className="relative">
                <div className="h-[600px] w-[500px] border-[10px] border-white">
                  <img
                    src={panel.image}
                    alt={`Story panel ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded bg-base-100 p-3 text-center text-sm shadow-lg">
                  {panel.text}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Mobile layout - carousel
          <div className="relative">
            <div className="relative h-[500px] w-full">
              {(() => {
                const panel = panels[Math.min(currentPanel, panels.length - 1)];
                return (
                  <>
                    <div className="h-full w-full border-[10px] border-white">
                      <img
                        src={panel?.image}
                        alt={`Story panel ${currentPanel + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 rounded bg-base-100 p-3 text-center text-sm shadow-lg">
                      {panel?.text}
                    </div>
                  </>
                );
              })()}
            </div>
            {/* Navigation dots */}
            <div className="mt-4 flex justify-center gap-2">
              {panels.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPanel(index)}
                  className={`h-2 w-2 rounded-full ${
                    currentPanel === index ? "bg-red-600" : "bg-gray-400"
                  }`}
                />
              ))}
            </div>
            {/* Previous/Next buttons */}
            {currentPanel > 0 && (
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-base-100 p-2 shadow-lg"
                aria-label="Previous panel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
            )}
            {currentPanel < panels.length - 1 && (
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-base-100 p-2 shadow-lg"
                aria-label="Next panel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="btn btn-lg my-12 mt-6 border-red-600 bg-red-600"
      >
        {isDesktop
          ? "Build Your Bracket"
          : `${currentPanel === panels.length - 1 ? "Build Your Bracket" : "Skip"}`}
      </button>
    </div>
  );
};
