// GENERADO por scripts-migracion/gen-shared.mjs desde site/Producto.dc.html (idéntico en las 11 páginas internas).
export interface Star {
  left: string;
  top: string;
  size: string;
  blur: number;
  spread: number;
  dur: string;
  delay: string;
}
export interface Mote {
  left: string;
  size: string;
  dx: string;
  dur: string;
  delay: string;
}
export const heroStyle =
  'position:relative;height:clamp(600px,88vh,780px);overflow:hidden;background:#0a2a7a';
export const heroBgStyle =
  'position:absolute;inset:-4%;z-index:0;pointer-events:none;animation:kb 24s ease-in-out infinite alternate';
export const heroBgLayers = [
  { id: 'bg-night', bg: '/uploads/hero-noche.webp' },
  { id: 'bg-day', bg: '/uploads/hero-dia.webp' },
  { id: 'bg-sunset', bg: '/uploads/hero-tarde.webp' },
] as const;
export const starsStyle =
  'position:absolute;left:0;right:0;top:0;height:55%;z-index:1;pointer-events:none;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,#000 55%,transparent);mask-image:linear-gradient(180deg,#000 55%,transparent)';
export const motesStyle = 'position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden';
export const stars: Star[] = [
  { left: '65.0', top: '42.6', size: '4.18', blur: 10, spread: 2, dur: '2.9', delay: '0.6' },
  { left: '75.9', top: '10.0', size: '1.9', blur: 5, spread: 1, dur: '3.2', delay: '4.8' },
  { left: '61.9', top: '39.8', size: '3.3', blur: 5, spread: 1, dur: '3.1', delay: '3.1' },
  { left: '45.3', top: '21.5', size: '2.5', blur: 5, spread: 1, dur: '4.6', delay: '1.5' },
  { left: '11.8', top: '36.9', size: '1.3', blur: 5, spread: 1, dur: '3.5', delay: '1.9' },
  { left: '54.1', top: '28.4', size: '2.6', blur: 5, spread: 1, dur: '3.3', delay: '4.4' },
  { left: '83.8', top: '2.8', size: '1.3', blur: 5, spread: 1, dur: '4.8', delay: '2.4' },
  { left: '8.4', top: '36.9', size: '2.6', blur: 5, spread: 1, dur: '3.3', delay: '5.1' },
  { left: '76.6', top: '37.3', size: '5.5', blur: 10, spread: 2, dur: '3.1', delay: '4.0' },
  { left: '88.6', top: '36.3', size: '3.0', blur: 5, spread: 1, dur: '3.6', delay: '3.8' },
  { left: '74.3', top: '13.8', size: '1.7', blur: 5, spread: 1, dur: '2.9', delay: '3.0' },
  { left: '37.8', top: '24.3', size: '3.1', blur: 5, spread: 1, dur: '2.7', delay: '2.5' },
  { left: '68.3', top: '34.0', size: '3.2', blur: 5, spread: 1, dur: '4.4', delay: '0.2' },
  { left: '17.8', top: '17.4', size: '3.0', blur: 5, spread: 1, dur: '2.4', delay: '2.0' },
  { left: '46.0', top: '39.4', size: '2.5', blur: 5, spread: 1, dur: '2.4', delay: '0.2' },
  { left: '31.0', top: '45.7', size: '2.3', blur: 5, spread: 1, dur: '4.2', delay: '4.1' },
  { left: '47.1', top: '5.6', size: '5.5', blur: 10, spread: 2, dur: '5.2', delay: '2.7' },
  { left: '9.5', top: '40.4', size: '2.9', blur: 5, spread: 1, dur: '2.5', delay: '3.8' },
  { left: '85.2', top: '29.1', size: '2.4', blur: 5, spread: 1, dur: '3.5', delay: '3.9' },
  { left: '70.7', top: '28.2', size: '2.4', blur: 5, spread: 1, dur: '2.4', delay: '5.6' },
  { left: '36.7', top: '31.0', size: '2.4', blur: 5, spread: 1, dur: '3.1', delay: '1.7' },
  { left: '39.1', top: '34.1', size: '1.8', blur: 5, spread: 1, dur: '2.5', delay: '0.3' },
  { left: '96.7', top: '43.0', size: '3.1', blur: 5, spread: 1, dur: '3.5', delay: '5.1' },
  { left: '35.8', top: '15.1', size: '3.4', blur: 5, spread: 1, dur: '4.5', delay: '0.4' },
  {
    left: '1.2',
    top: '18.6',
    size: '5.720000000000001',
    blur: 10,
    spread: 2,
    dur: '4.4',
    delay: '5.6',
  },
  { left: '33.7', top: '7.9', size: '2.3', blur: 5, spread: 1, dur: '2.5', delay: '1.7' },
  { left: '15.3', top: '42.5', size: '1.6', blur: 5, spread: 1, dur: '4.0', delay: '0.4' },
  { left: '79.6', top: '32.4', size: '2.9', blur: 5, spread: 1, dur: '3.4', delay: '2.4' },
  { left: '89.9', top: '18.6', size: '2.6', blur: 5, spread: 1, dur: '2.7', delay: '2.0' },
  { left: '83.5', top: '25.1', size: '1.6', blur: 5, spread: 1, dur: '4.8', delay: '2.3' },
  { left: '82.9', top: '33.3', size: '3.0', blur: 5, spread: 1, dur: '2.8', delay: '3.2' },
  { left: '73.6', top: '33.1', size: '1.9', blur: 5, spread: 1, dur: '4.5', delay: '0.5' },
  { left: '48.6', top: '12.7', size: '3.08', blur: 10, spread: 2, dur: '4.2', delay: '0.5' },
  { left: '19.2', top: '25.1', size: '2.9', blur: 5, spread: 1, dur: '2.9', delay: '2.4' },
  { left: '93.2', top: '9.1', size: '2.7', blur: 5, spread: 1, dur: '4.9', delay: '3.6' },
  { left: '19.1', top: '9.2', size: '1.3', blur: 5, spread: 1, dur: '2.5', delay: '1.4' },
  { left: '97.0', top: '11.8', size: '2.8', blur: 5, spread: 1, dur: '4.0', delay: '0.7' },
  { left: '57.0', top: '42.6', size: '2.8', blur: 5, spread: 1, dur: '4.4', delay: '5.8' },
  { left: '3.2', top: '18.3', size: '1.3', blur: 5, spread: 1, dur: '2.8', delay: '5.8' },
  { left: '24.6', top: '43.0', size: '3.0', blur: 5, spread: 1, dur: '3.1', delay: '4.5' },
];
export const motes: Mote[] = [
  { left: '8', size: '12', dx: '30', dur: '7', delay: '0' },
  { left: '20', size: '9', dx: '-24', dur: '9', delay: '2.5' },
  { left: '34', size: '14', dx: '18', dur: '8', delay: '5' },
  { left: '48', size: '8', dx: '-30', dur: '10', delay: '1.2' },
  { left: '62', size: '13', dx: '26', dur: '7.5', delay: '3.8' },
  { left: '76', size: '10', dx: '-16', dur: '9.5', delay: '6' },
  { left: '90', size: '12', dx: '22', dur: '8.5', delay: '2' },
  { left: '14', size: '7', dx: '-20', dur: '11', delay: '7' },
  { left: '84', size: '8', dx: '28', dur: '10', delay: '4.4' },
];
