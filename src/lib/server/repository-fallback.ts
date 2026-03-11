type RepositoryDataSource = "mock" | "database";

export function getConfiguredDataSource(): RepositoryDataSource {
  return process.env.RECRUIT_DATA_SOURCE === "database" ? "database" : "mock";
}

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function logRepositoryFallback(scope: string, error: unknown) {
  console.error(`[repository-fallback] ${scope}`, error);
}

export async function withRepositoryFallback<T>(input: {
  scope: string;
  database: () => Promise<T>;
  mock: () => T | Promise<T>;
}) {
  if (getConfiguredDataSource() !== "database") {
    return input.mock();
  }

  if (!isDatabaseConfigured()) {
    logRepositoryFallback(
      `${input.scope}: missing DATABASE_URL while RECRUIT_DATA_SOURCE=database; falling back to mock storage`,
      new Error("DATABASE_URL is not configured"),
    );
    return input.mock();
  }

  try {
    return await input.database();
  } catch (error) {
    logRepositoryFallback(
      `${input.scope}: database access failed; falling back to mock storage`,
      error,
    );
    return input.mock();
  }
}
