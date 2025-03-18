import { type NextApiRequest, type NextApiResponse } from "next";

// TODO: update this when we have a domain
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const getBaseUrl = () => {
      return "https://almamortem.com";
    };

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjIxNzI0OCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGViYTc4NzE3YjZmMDU5Q0ZFMGI3NUU3NUMyZWQ0QkI3Y0E2NTE1NEYifQ",
      payload: "eyJkb21haW4iOiJhbG1hbW9ydGVtLmNvbSJ9",
      signature: "MHhlMzU5MDBiYWQ0ZTcwYjUwMWY4ZTE4NzgxNWEyMWFjMGQ1ZjBlZmUzZDdlMzhiNzY2MWQ1MTlhMzQ4MGVhMTUzMzZlMDFlZmMyMjQwMTRmYzhjZmE3MjU0OWVlMjNiNDhlODZiYTYxMWRmZDM2ZWI2YTJmZWQ1Y2ZlZmM2ODE1NDFi",
    },
    frame: {
      version: "1",
      name: "Alma Mortem",
      homeUrl: getBaseUrl(),
      iconUrl: `${getBaseUrl()}/images/icon.png`,
      splashImageUrl: `${getBaseUrl()}/images/logo.png`,
      splashBackgroundColor: "#fafafa",
    },
  };

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(config);
}