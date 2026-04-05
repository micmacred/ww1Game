// Period typography stack — one font per layer
// Theatre: EB Garamond — period serif for cartographic war-room aesthetic
// Campaign: Barlow Condensed — condensed stencil for field dispatch aesthetic
// Action: Special Elite — typewriter for colorized newsreel aesthetic

export const FONTS = {
  theatre: "'EB Garamond', 'Libre Caslon Text', Georgia, serif",
  campaign: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
  action: "'Special Elite', 'Courier New', monospace",
} as const;

export type LayerFont = keyof typeof FONTS;
