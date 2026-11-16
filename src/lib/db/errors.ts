export function isUniqueViolation(error: unknown): boolean {
  // Drizzle wraps driver errors, so the Postgres code sits on the cause chain.
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (
      typeof current === "object" &&
      current !== null &&
      "code" in current &&
      current.code === "23505"
    ) {
      return true;
    }
    current =
      typeof current === "object" && current !== null && "cause" in current
        ? current.cause
        : null;
  }
  return false;
}
