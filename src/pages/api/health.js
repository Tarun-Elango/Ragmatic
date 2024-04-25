import { middleware } from "../../middleware/middleware";

export default async function handler(req, res) {
  // Apply the middleware to protect this route
  const result = await middleware(req);

  if (!result.success) {
    res.status(400).json({ success: false, message: "Its live, but no access token" });
  } else {
    // Access token details from the request
    const { exp } = result.tokenDetails;
    const expTime = new Date(exp * 1000);

    // Your protected API logic goes here
    res.status(200).json({
      success: true,
      message: 'Protected API route accessed successfully.',
      exp: expTime.toISOString(), // Convert the timestamp to ISO format or any other desired format
    });
  }
}

