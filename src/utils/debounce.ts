export function debounce<ARGS extends any[], F extends (...args: ARGS) => void>(
  fn: F,
  interval = 100,
): (...args: ARGS) => void {
  let timer: NodeJS.Timeout | undefined;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, interval);
  };
}
