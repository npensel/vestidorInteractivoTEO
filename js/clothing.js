/* Canonical TEO wardrobe assets. Pants are intentionally not part of the catalog. */

const svgAsset = (folder, file) => `SVGs/${folder}/${encodeURIComponent(file)}`;

const ITEMS_DATA = {
  head: [
    ['Anteojos.svg', 'Anteojos', '👓', '¡Qué mirada tan genial!'],
    ['Auriculares.svg', 'Auriculares', '🎧', '¡Me ayudan a escuchar música suave!'],
    ['Corona.svg', 'Corona', '👑', '¡Su majestad TEO!'],
    ['Galera de mago.svg', 'Galera de mago', '🎩', '¡Abracadabra!'],
    ['Gorro de cocinero.svg', 'Gorro de cocinero', '👨‍🍳', '¡Hoy cocinamos juntos!'],
    ['Gorro de invierno.svg', 'Gorro de invierno', '❄️', '¡Qué calentito!'],
    ['Moño.svg', 'Moño', '🎀', '¡Qué elegante me veo!'],
    ['Sombrero de hechicero.svg', 'Sombrero de hechicero', '🧙', '¡Vamos a lanzar un hechizo!'],
    ['Sombrero.svg', 'Sombrero', '👒', '¡Listos para una aventura!'],
    ['Vincha con flores.svg', 'Vincha con flores', '🌸', '¡Me encantan estas flores!']
  ].map(([file, name, icon, phrase], index) => ({
    id: `head-${index + 1}`,
    name,
    icon,
    phrase,
    assetPath: svgAsset('Gorros', file)
  })),
  top: [
    ['Camiseta de fútbol.svg', 'Camiseta de fútbol', '⚽', '¡Vamos equipo!'],
    ['Chaleco de explorador.svg', 'Chaleco de explorador', '🧭', '¡Listos para explorar!'],
    ['Remera arcoíris.svg', 'Remera arcoíris', '🌈', '¡Cuántos colores!'],
    ['Remera con sol.svg', 'Remera con sol', '☀️', '¡Un día lleno de alegría!'],
    ['Remera de superhéroe.svg', 'Remera de superhéroe', '🦸', '¡TEO al rescate!'],
    ['Remera de vaca.svg', 'Remera de vaca', '🐮', '¡Muuu!'],
    ['Remera espacial.svg', 'Remera espacial', '🚀', '¡Al espacio!'],
    ['Remera mariposa.svg', 'Remera mariposa', '🦋', '¡Qué linda mariposa!'],
    ['Remera pijama.svg', 'Remera pijama', '🌙', '¡Hora de descansar!'],
    ['Remera rayada.svg', 'Remera rayada', '⛵', '¡Rumbo al mar!']
  ].map(([file, name, icon, phrase], index) => ({
    id: `top-${index + 1}`,
    name,
    icon,
    phrase,
    assetPath: svgAsset('Remeras', file)
  }))
};
