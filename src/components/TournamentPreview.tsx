import Image from "next/image";
import { useRouter } from "next/router";

interface TournamentPreviewProps {
  name: string;
  entryCount: number;
  imageUrl: string;
}

export const TournamentPreview: React.FC<TournamentPreviewProps> = ({
  name,
  entryCount,
  imageUrl,
}) => {
  const router = useRouter();

  const handleEnter = () => {
    // Preserve the viewport settings by adding viewport query parameter
    const isMobile = window.innerWidth < 1024;
    void router.push({
      pathname: "/bracket/0/build",
      query: { viewport: isMobile ? "mobile" : "desktop" },
    });
  };

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <figure className="relative h-48 w-full">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          priority
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title justify-center text-center">{name}</h2>
        <div className="flex flex-col items-center gap-2">
          <p className="text-base-content/70">{entryCount} Entries</p>
          <button onClick={handleEnter} className="btn btn-primary">
            Enter
          </button>
        </div>
      </div>
    </div>
  );
};
