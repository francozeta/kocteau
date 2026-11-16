/** A preview experiment is never available on a production deployment. */
export function isDiscoveryLabAvailable({
  vercelEnv,
  nodeEnv,
  localOptIn,
}: {
  vercelEnv: string | undefined;
  nodeEnv: string | undefined;
  localOptIn: boolean;
}) {
  return vercelEnv === "preview" ||
    (!vercelEnv && nodeEnv === "development" && localOptIn);
}
