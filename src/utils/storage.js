export function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem('slice-rush:' + key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function save(key, value) {
  try {
    localStorage.setItem('slice-rush:' + key, JSON.stringify(value));
  } catch {
    /* Storage may be disabled; the run continues in memory. */
  }
}
