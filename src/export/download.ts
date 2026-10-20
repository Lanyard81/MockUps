/** Save a blob or text as a file through the browser's download. */
export function downloadBlob(
  data: Blob | string,
  filename: string,
  type = 'application/octet-stream',
) {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** A safe file name from a mockup or frame name. */
export function slug(name: string, fallback = 'mockup'): string {
  const s = name
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60);
  return s || fallback;
}

/** Make names unique within a set, e.g. `home`, `home-2`. */
export function uniqueNames(names: string[], extension: string): string[] {
  const used = new Set<string>();
  return names.map((n) => {
    let candidate = `${n}.${extension}`;
    for (let i = 2; used.has(candidate); i++) candidate = `${n}-${i}.${extension}`;
    used.add(candidate);
    return candidate;
  });
}
