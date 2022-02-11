//


export function measure(callback: () => void): number {
  let before = process.hrtime();
  callback();
  let [elapsedSeconds, elapsedNanoseconds] = process.hrtime(before);
  let interval = Math.floor(elapsedSeconds * 1000 + elapsedNanoseconds / 1000000);
  return interval;
}

export async function measureAsync(callback: () => Promise<void>): Promise<number> {
  let before = process.hrtime();
  await callback();
  let [elapsedSeconds, elapsedNanoseconds] = process.hrtime(before);
  let interval = Math.floor(elapsedSeconds * 1000 + elapsedNanoseconds / 1000000);
  return interval;
}