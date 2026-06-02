export const logger = {
  info(message: string): void {
    console.log(message);
  },
  warn(message: string): void {
    console.warn(`[warn] ${message}`);
  },
  error(message: string): void {
    console.error(`[error] ${message}`);
  }
};
