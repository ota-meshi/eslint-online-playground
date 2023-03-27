export function debounce<
  F extends (...args: A) => void | Promise<void>,
  A extends any[] = never[]
>(fn: F, interval = 100): F {
  let timer: NodeJS.Timeout | undefined;

  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void fn(...(args as any));
    }, interval);
  }) as unknown as F;
}
