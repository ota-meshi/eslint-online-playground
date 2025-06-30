export function alertAndLog(message: string): void {
  // eslint-disable-next-line no-alert -- OK
  if (typeof alert === "function") alert(message);
  // eslint-disable-next-line no-console -- OK
  console.log(message);
}
