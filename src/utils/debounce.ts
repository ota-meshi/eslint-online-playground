// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- ignore
export function debounce<F extends Function>(fn: F, interval = 100): F {
  let timer: NodeJS.Timeout | undefined;

  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void fn(...(args as any));
    }, interval);
  }) as unknown as F;
}
