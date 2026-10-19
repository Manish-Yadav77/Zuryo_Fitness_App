/** Helper utilities for 15-minute time atoms and slot parsing */

export const ATOM_MINUTES = 15;
export const SESSION_MINUTES = 60;
export const ATOMS_PER_SESSION = SESSION_MINUTES / ATOM_MINUTES; // 4 atoms

/** Rounds a date up to the next 15-minute interval */
export function ceilToAtom(date: Date): Date {
  const ms = 1000 * 60 * ATOM_MINUTES;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

/** Generates array of 15-min start timestamps for a 60-min session */
export function getSessionAtoms(startAt: Date): Date[] {
  const atoms: Date[] = [];
  const startTime = startAt.getTime();
  for (let i = 0; i < ATOMS_PER_SESSION; i++) {
    atoms.push(new Date(startTime + i * ATOM_MINUTES * 60 * 1000));
  }
  return atoms;
}

/** Parses "HH:mm" time string to minutes from midnight */
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map((v) => parseInt(v, 10));
  return (hours ?? 0) * 60 + (minutes ?? 0);
}