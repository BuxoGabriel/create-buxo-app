import { Bricolage_Grotesque, Figtree, Source_Serif_4 } from 'next/font/google';

// Roles: brand = the site name and big display moments, ui = headings and controls, body = reading.
// To change a font, swap the import and keep the `variable` name; globals.css maps the variables
// to --font-brand / --font-ui / --font-body.
export const fontBrand = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-brand-face',
});
export const fontUi = Figtree({ subsets: ['latin'], display: 'swap', variable: '--font-ui-face' });
export const fontBody = Source_Serif_4({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-body-face',
});
