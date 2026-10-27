/* =========================================================================
   PHOTO EXPORT SYSTEM (DEFINITIVO - CAPAS DE TAMAÑO COMPLETO)
   ========================================================================= */
function exportTeoPhotoDirectly() {
  playTone(800, 'triangle', 0.2);

  const canvas = document.getElementById('snapshotCanvas');
  if (!canvas) {
    showToast('No se encontró el lienzo para la foto.');
    return;
  }

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. FONDO Y MARCO DEL RECUERDO
  ctx.fillStyle = '#F0F7FF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

  // 2. TÍTULO
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 30px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('¡Mi Amigo TEO!', canvas.width / 2, 65);

  // 3. OBTENER LAS IMÁGENES ACTIVAS EN PANTALLA
  const source = STATE.isRealPhotoActive
    ? document.getElementById('teoRealPhoto')
    : document.getElementById('teoDrawingImage');

  const activeTopImg = document.querySelector('#layerTop img');
  const activeHeadImg = document.querySelector('#layerHead img');

  if (!source || !source.src) {
    showToast('No se encontró la imagen de TEO.');
    return;
  }

  // Función auxiliar para cargar imágenes con CORS
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
      img.src = src;
    });
  }

  // Coordenadas base de TEO en el canvas de exportación (ancho: 320, alto: 420)
  const teoX = 160;
  const teoY = 110;
  const teoW = 320;
  const teoH = 420;

  // 4. SECUENCIA DE RENDERIZADO
  loadImage(source.src)
    .then(baseImg => {
      // Dibujar base de TEO
      ctx.drawImage(baseImg, teoX, teoY, teoW, teoH);

      // Dibujar remera (al ser PNG transparente de tamaño completo, usa las mismas coordenadas)
      if (activeTopImg && activeTopImg.src) {
        return loadImage(activeTopImg.src).then(topImg => {
          ctx.drawImage(topImg, teoX, teoY, teoW, teoH);
        });
      }
    })
    .then(() => {
      // Dibujar accesorio / sombrero (también PNG transparente de tamaño completo)
      if (activeHeadImg && activeHeadImg.src) {
        return loadImage(activeHeadImg.src).then(headImg => {
          ctx.drawImage(headImg, teoX, teoY, teoW, teoH);
        });
      }
    })
    .then(() => {
      // 5. PIE DE FOTO
      ctx.font = '600 15px "Fredoka", sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Proyecto Final de Carrera - UNLaM', canvas.width / 2, 690);

      // 6. DESCARGAR ARCHIVO PNG
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Mi_TEO_${currentChildProfile.name || 'Personalizado'}_${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('📸 ¡Foto de recuerdo descargada con éxito!');
      } catch (e) {
        console.error('Error al exportar la foto:', e);
        showToast('No se pudo generar la foto.');
      }
    })
    .catch(error => {
      console.error('Error al generar la imagen:', error);
      showToast('No se pudo generar la foto.');
    });
}