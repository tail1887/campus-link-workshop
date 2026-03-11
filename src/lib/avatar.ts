function hashSeed(seed: string) {
  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }

  return Math.abs(hash);
}

function pickInitial(label: string) {
  const normalized = label.trim();
  return normalized ? [...normalized][0]!.toUpperCase() : "?";
}

export function buildAvatarDataUrl(seed: string, label: string) {
  const hash = hashSeed(seed);
  const hueA = hash % 360;
  const hueB = (hueA + 48) % 360;
  const hueC = (hueA + 180) % 360;
  const initial = pickInitial(label);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hueA} 78% 62%)" />
          <stop offset="100%" stop-color="hsl(${hueB} 74% 52%)" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="40" fill="url(#bg)" />
      <circle cx="128" cy="40" r="34" fill="hsla(${hueC} 90% 92% / 0.28)" />
      <circle cx="34" cy="136" r="28" fill="hsla(${hueB} 100% 100% / 0.16)" />
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="white">${initial}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
