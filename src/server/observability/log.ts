import "server-only";

export function logOperationalError(event: string, error: unknown) {
  const category = error instanceof Error ? error.name : "UnknownError";

  console.error(JSON.stringify({ level: "error", event, category }));
}
