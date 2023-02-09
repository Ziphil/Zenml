//


export function measure(callback: () => void): number {
  const before = process.hrtime();
  callback();
  const [elapsedSeconds, elapsedNanoseconds] = process.hrtime(before);
  const interval = Math.floor(elapsedSeconds * 1000 + elapsedNanoseconds / 1000000);
  return interval;
}

export async function measureAsync(callback: () => Promise<void>): Promise<number> {
  const before = process.hrtime();
  await callback();
  const [elapsedSeconds, elapsedNanoseconds] = process.hrtime(before);
  const interval = Math.floor(elapsedSeconds * 1000 + elapsedNanoseconds / 1000000);
  return interval;
}