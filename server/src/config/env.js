const REQUIRED_VARS = ["GITHUB_TOKEN", "CLIENT_URL"];

export const validateEnvironment = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is not set. Running without persistent cache.");
  }
};
