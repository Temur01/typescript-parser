export function formatDate(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return formatDate(new Date(0));
  }

  return date.toISOString().slice(0, 10);
}

export function fromUnixSeconds(value: number | null | undefined): Date | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return new Date(value * 1000);
}
