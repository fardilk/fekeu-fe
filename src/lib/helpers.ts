export function formatDate(date?: string | number | Date) {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleDateString();
}
