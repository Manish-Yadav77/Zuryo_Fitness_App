const istFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** Always formats in India time, whatever timezone the server runs in. Example: "20 Oct 2026, 7:30 pm IST" */
export function formatIst(date: Date): string {
  return `${istFormatter.format(date)} IST`;
}