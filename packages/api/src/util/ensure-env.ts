export function ensureEnv(envName: string): string {
  const tableName = process.env[envName];
  if (!tableName) {
    throw new Error(
      `This handler is misconfigured. Please provide the \`${envName}\` environment variable.`,
    );
  }
  return tableName;
}
