import { ImageResponse } from 'next/og';

import { APP_URL } from '~/constants';

export const runtime = 'edge';

// Load the AnimeAce font
const animeAceBold = fetch(
  new URL('../../../public/fonts/animeace2bb_ot/animeace2_bld.otf', import.meta.url)
).then((res) => res.arrayBuffer());

export default async function handler() {
  try {
    // Load the team image and font
    const [imageData, fontData] = await Promise.all([
      fetch(`${APP_URL}/images/teams/champ/2.png`).then((res) => res.arrayBuffer()),
      animeAceBold,
    ]);

    // Create the image response
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            position: 'relative',
          }}
        >
          <img
            src={`data:image/png;base64,${Buffer.from(imageData).toString('base64')}`}
            alt={`Alma Mortem`}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'cover',
              border: 'none',
            }}
          />
          <div
            tw="absolute top-[5%] text-[72px] font-bold text-black text-center font-anime uppercase tracking-wider bg-red-600 bg-opacity-50 p-6"
          >
            Alma Mortem
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 1200,
        fonts: [
          {
            name: 'AnimeAce',
            data: fontData,
          },
        ],
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      }
    );
  } catch (e) {
    console.error(e);
    return new Response('Failed to generate image', { status: 500 });
  }
} 

