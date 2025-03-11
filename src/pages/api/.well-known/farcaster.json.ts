import { type NextApiRequest, type NextApiResponse } from "next";

// TODO: update this when we have a domain
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const getBaseUrl = () => {
      return "https://march-madness-onchain.vercel.app";
    };

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjIxNzI0OCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGViYTc4NzE3YjZmMDU5Q0ZFMGI3NUU3NUMyZWQ0QkI3Y0E2NTE1NEYifQ",
      payload: "eyJkb21haW4iOiJzdXBlcmJvd2wtb25jaGFpbi52ZXJjZWwuYXBwIn0",
      signature: "MHgwYmUwMDIyMDYzMmU1Y2RiZTMxNjVhNWIzYTQ2MjM0NDM2MzBkZWNkNTljMDllMTIxNjY1M2M5ZjU4MWU4OTQzNTFlYmYxNjc0MjE2ZDExMzgyOWVkNzJmYWMzOGI5NjRjZWMwZGViYTRjYTJjNjIwNDc3MThjMDBmYWU0MjE1MjFi",
    },
    frame: {
      version: "0.0.0",
      name: "March Madness",
      homeUrl: getBaseUrl(),
      iconUrl: `${getBaseUrl()}/images/icon.png`,
      splashImageUrl: `${getBaseUrl()}/images/logo.png`,
      splashBackgroundColor: "#fafafa",
    },
  };

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(config);
}