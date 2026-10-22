/* Canonical TEO skin assets. Real assets are PNGs; drawing assets are SVGs. */

const SKIN_DEFINITIONS = [
  ['osito', 'Osito', 'Osito', '¡Soy TEO en versión Osito clásico!'],
  ['chanchito', 'Chanchito', 'Chanchito', '¡Oink oink! ¡Soy TEO Chanchito rosa!'],
  ['chimuelo', 'Chimuelo', 'Chimuelo', '¡Soy TEO dragón Chimuelo de la noche!'],
  ['dino', 'Dino', 'Dino', '¡Grrr! ¡Soy TEO Dino con escamitas verdes!'],
  ['oveja', 'Oveja', 'Oveja', '¡Beee! ¡Soy TEO Ovejita suave y lanuda!'],
  ['perrito', 'Perrito', 'Perrito', '¡Guau guau! ¡Soy TEO Perrito con orejitas caídas!'],
  ['spiderman', 'Spiderman', 'Spiderman', '¡Tu amigable vecino TEO Spiderman!'],
  ['stitch', 'Stitch', 'Stitch', '¡Hola amigo! ¡Soy TEO Stitch alienígena!'],
  ['tiburon', 'Tiburón', 'Tiburón', '¡Aleta arriba! ¡Soy TEO Tiburón de los mares!']
];

const SKINS_DATA = SKIN_DEFINITIONS.map(([id, name, fileBase, phrase]) => ({
  id,
  name,
  phrase,
  realPath: `SVGs/Teo real/${encodeURIComponent(fileBase)}.png`,
  drawingPath: `SVGs/Teo dibujo/${encodeURIComponent(fileBase)}.svg`
}));
