#!/usr/bin/env node
/**
 * Generates the self-contained SVG product illustrations used by the demo
 * catalogue (public/products/*.svg). They are lightweight stand-ins that can
 * be replaced with real boutique photos from the admin dashboard at any time.
 *
 *   node scripts/generate-placeholder-images.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "products");
mkdirSync(outDir, { recursive: true });

const GOLD = "#C59B27";

const items = [
  { name: "kurti-rose", type: "kurti", base: "#E8A3B8", deep: "#9B1B54", bg: "#FBEFF3", label: "Chikankari" },
  { name: "kurti-indigo", type: "kurti-aline", base: "#3D5A98", deep: "#1F2F57", bg: "#EEF1F8", label: "Block Print" },
  { name: "kurti-wine", type: "kurti", base: "#7A1638", deep: "#4A0B21", bg: "#F7ECEF", label: "Zari Butti" },
  { name: "suit-mehendi", type: "anarkali", base: "#7C8B3A", deep: "#4C5622", bg: "#F3F4E8", label: "Sequin Yoke" },
  { name: "suit-ivory", type: "suit", base: "#F4EBDD", deep: "#C9A98A", bg: "#FAF5EC", label: "Resham Work" },
  { name: "suit-rani", type: "suit", base: "#D6246E", deep: "#8E1247", bg: "#FCEDF3", label: "Mirror Work" },
  { name: "saree-banarasi", type: "saree", base: "#A3195B", deep: "#6B0E3A", bg: "#FBEEF4", label: "Banarasi Zari" },
  { name: "saree-peach", type: "saree", base: "#F2B29A", deep: "#C9785C", bg: "#FDF3EE", label: "Georgette Floral" },
  { name: "saree-emerald", type: "saree", base: "#11745A", deep: "#0A4A39", bg: "#EBF5F1", label: "Temple Border" },
  { name: "cordset-marigold", type: "cordset", base: "#E9A923", deep: "#A86F0C", bg: "#FDF6E6", label: "Ethnic Print" },
  { name: "cordset-lavender", type: "cordset", base: "#B39BD0", deep: "#6F5596", bg: "#F5F1FA", label: "Gota Patti" },
  { name: "cordset-ajrakh", type: "cordset", base: "#9E2B25", deep: "#5B1612", bg: "#F8EDEB", label: "Ajrakh" },
];

const motif = (id, fill, accent) => `
  <pattern id="${id}" width="44" height="44" patternUnits="userSpaceOnUse">
    <g fill="${accent}" opacity="0.75">
      <circle cx="22" cy="22" r="3"/>
      <circle cx="22" cy="15" r="2.4"/><circle cx="22" cy="29" r="2.4"/>
      <circle cx="15" cy="22" r="2.4"/><circle cx="29" cy="22" r="2.4"/>
      <circle cx="0" cy="0" r="1.6"/><circle cx="44" cy="0" r="1.6"/>
      <circle cx="0" cy="44" r="1.6"/><circle cx="44" cy="44" r="1.6"/>
    </g>
    <rect width="44" height="44" fill="${fill}" opacity="0"/>
  </pattern>`;

const garments = {
  kurti: (c) => `
    <path d="M255 175 Q300 218 345 175 L398 192 L462 305 L428 324 L392 252 L412 640 L188 640 L208 252 L172 324 L138 305 L202 192 Z" fill="${c.base}"/>
    <path d="M255 175 Q300 218 345 175 L398 192 L462 305 L428 324 L392 252 L412 640 L188 640 L208 252 L172 324 L138 305 L202 192 Z" fill="url(#m-${c.name})"/>
    <path d="M262 182 Q300 214 338 182 L330 250 Q300 268 270 250 Z" fill="${c.deep}" opacity="0.35"/>
    <path d="M190 622 L410 622 L412 640 L188 640 Z" fill="${GOLD}"/>
    <path d="M428 324 L462 305 L456 294 L423 313 Z" fill="${GOLD}"/>
    <path d="M172 324 L138 305 L144 294 L177 313 Z" fill="${GOLD}"/>`,
  "kurti-aline": (c) => `
    <path d="M255 175 Q300 218 345 175 L398 192 L462 305 L428 324 L392 252 L440 640 L160 640 L208 252 L172 324 L138 305 L202 192 Z" fill="${c.base}"/>
    <path d="M255 175 Q300 218 345 175 L398 192 L462 305 L428 324 L392 252 L440 640 L160 640 L208 252 L172 324 L138 305 L202 192 Z" fill="url(#m-${c.name})"/>
    <path d="M285 180 L315 180 L315 175 Q300 186 285 175 Z" fill="${c.deep}"/>
    <line x1="300" y1="190" x2="300" y2="330" stroke="${c.deep}" stroke-width="3"/>
    <g fill="${GOLD}"><circle cx="300" cy="220" r="4"/><circle cx="300" cy="255" r="4"/><circle cx="300" cy="290" r="4"/></g>
    <path d="M162 622 L438 622 L440 640 L160 640 Z" fill="${c.deep}"/>`,
  anarkali: (c) => `
    <path d="M245 690 L262 760 L292 760 L298 690 Z M302 690 L308 760 L338 760 L355 690 Z" fill="${c.deep}"/>
    <path d="M255 175 Q300 218 345 175 L398 192 L462 305 L428 324 L392 252 L388 330 L500 700 L100 700 L212 330 L208 252 L172 324 L138 305 L202 192 Z" fill="${c.base}"/>
    <path d="M255 175 Q300 218 345 175 L398 192 L392 252 L388 330 L212 330 L208 252 L202 192 Z" fill="url(#m-${c.name})"/>
    <path d="M212 322 L388 322 L390 338 L210 338 Z" fill="${GOLD}"/>
    <path d="M104 684 L496 684 L500 700 L100 700 Z" fill="${GOLD}"/>
    <path d="M345 175 L398 192 L470 420 L440 700 L410 700 L430 430 Z" fill="${GOLD}" opacity="0.28"/>`,
  suit: (c) => `
    <path d="M222 600 L232 760 L292 760 L298 600 Z M302 600 L308 760 L368 760 L378 600 Z" fill="${c.deep}"/>
    <path d="M255 175 Q300 218 345 175 L398 192 L462 305 L428 324 L392 252 L404 620 L196 620 L208 252 L172 324 L138 305 L202 192 Z" fill="${c.base}"/>
    <path d="M255 175 Q300 218 345 175 L398 192 L462 305 L428 324 L392 252 L404 620 L196 620 L208 252 L172 324 L138 305 L202 192 Z" fill="url(#m-${c.name})"/>
    <path d="M262 182 Q300 214 338 182 L322 236 Q300 248 278 236 Z" fill="${GOLD}" opacity="0.6"/>
    <path d="M198 604 L402 604 L404 620 L196 620 Z" fill="${GOLD}"/>
    <path d="M202 192 L255 175 L210 520 L176 700 L150 690 L178 470 Z" fill="${c.deep}" opacity="0.32"/>`,
  saree: (c) => `
    <path d="M232 330 L368 330 L430 740 L170 740 Z" fill="${c.base}"/>
    <path d="M232 330 L368 330 L430 740 L170 740 Z" fill="url(#m-${c.name})"/>
    <g stroke="${c.deep}" stroke-width="2" opacity="0.45">
      <line x1="262" y1="440" x2="246" y2="740"/><line x1="282" y1="440" x2="274" y2="740"/>
      <line x1="302" y1="440" x2="302" y2="740"/><line x1="322" y1="440" x2="330" y2="740"/>
    </g>
    <path d="M176 712 L424 712 L430 740 L170 740 Z" fill="${GOLD}"/>
    <path d="M250 190 Q300 222 350 190 L384 206 L396 262 L204 262 L216 206 Z" fill="${c.deep}"/>
    <path d="M226 318 L374 318 L372 334 L228 334 Z" fill="${c.deep}" opacity="0.6"/>
    <path d="M216 196 L284 190 L442 440 L400 498 L214 300 Z" fill="${c.base}"/>
    <path d="M216 196 L284 190 L442 440 L400 498 L214 300 Z" fill="url(#m-${c.name})"/>
    <path d="M268 190 L284 190 L442 440 L428 458 Z" fill="${GOLD}"/>
    <path d="M400 498 L442 440 L452 452 L410 512 Z" fill="${GOLD}"/>`,
  cordset: (c) => `
    <path d="M210 430 L196 760 L288 760 L300 520 L312 760 L404 760 L390 430 Z" fill="${c.base}"/>
    <path d="M210 430 L196 760 L288 760 L300 520 L312 760 L404 760 L390 430 Z" fill="url(#m-${c.name})" opacity="0.7"/>
    <path d="M198 742 L288 742 L288 760 L196 760 Z M312 742 L402 742 L404 760 L312 760 Z" fill="${c.deep}"/>
    <path d="M262 178 L300 228 L338 178 L398 194 L470 320 L432 340 L392 268 L398 452 L202 452 L208 268 L168 340 L130 320 L202 194 Z" fill="${c.base}"/>
    <path d="M262 178 L300 228 L338 178 L398 194 L470 320 L432 340 L392 268 L398 452 L202 452 L208 268 L168 340 L130 320 L202 194 Z" fill="url(#m-${c.name})"/>
    <path d="M262 178 L300 228 L338 178 L326 176 L300 210 L274 176 Z" fill="${GOLD}"/>
    <path d="M202 436 L398 436 L398 452 L202 452 Z" fill="${c.deep}" opacity="0.7"/>`,
};

function mainSvg(c) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" role="img" aria-label="${c.label} illustration">
  <defs>
    <linearGradient id="bg-${c.name}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.bg}"/><stop offset="1" stop-color="#FDFBF7"/>
    </linearGradient>
    ${motif(`m-${c.name}`, c.base, GOLD)}
  </defs>
  <rect width="600" height="800" fill="url(#bg-${c.name})"/>
  <path d="M90 780 L90 300 Q90 110 300 70 Q510 110 510 300 L510 780" fill="none" stroke="${GOLD}" stroke-width="2" opacity="0.55"/>
  <path d="M110 780 L110 305 Q110 135 300 96 Q490 135 490 305 L490 780" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.35"/>
  <ellipse cx="300" cy="768" rx="170" ry="10" fill="#2D2D2D" opacity="0.06"/>
  <path d="M300 150 L300 120" stroke="#2D2D2D" stroke-width="2" opacity="0.35"/>
  <path d="M276 124 Q300 104 324 124" fill="none" stroke="#2D2D2D" stroke-width="2.5" opacity="0.35"/>
  ${garments[c.type](c)}
  <text x="300" y="58" text-anchor="middle" font-family="Georgia, serif" font-size="18" letter-spacing="6" fill="${GOLD}">MINI CLOSET</text>
</svg>
`;
}

function detailSvg(c) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" role="img" aria-label="${c.label} fabric detail">
  <defs>
    ${motif(`d-${c.name}`, c.base, GOLD)}
    <pattern id="b-${c.name}" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="${c.deep}"/>
      <path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke="${GOLD}" stroke-width="2"/>
      <circle cx="20" cy="20" r="4" fill="${GOLD}"/>
    </pattern>
  </defs>
  <rect width="600" height="800" fill="${c.base}"/>
  <rect width="600" height="800" fill="url(#d-${c.name})"/>
  <rect x="0" y="620" width="600" height="80" fill="url(#b-${c.name})"/>
  <rect x="0" y="612" width="600" height="8" fill="${GOLD}"/>
  <rect x="0" y="700" width="600" height="8" fill="${GOLD}"/>
  <rect x="150" y="300" width="300" height="120" rx="6" fill="#FDFBF7" opacity="0.92"/>
  <text x="300" y="350" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#2D2D2D">${c.label}</text>
  <text x="300" y="386" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" letter-spacing="4" fill="${GOLD}">FABRIC DETAIL</text>
</svg>
`;
}

for (const item of items) {
  writeFileSync(join(outDir, `${item.name}.svg`), mainSvg(item));
  writeFileSync(join(outDir, `${item.name}-detail.svg`), detailSvg(item));
}

console.log(`Wrote ${items.length * 2} SVG illustrations to ${outDir}`);
