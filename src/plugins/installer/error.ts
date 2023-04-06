export function alertAndLog(message: string): void {
  // eslint-disable-next-line no-alert -- OK
  alert(message);
  // eslint-disable-next-line no-console -- OK
  console.log(message);
}
