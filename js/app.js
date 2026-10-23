let currentChildProfile = { name: 'Teo', age: '', gender: '', profile: '' };
/* =========================================================================
   VESTIDOR DE TEO - APPLICATION CONTROLLER & LOGIC
   ========================================================================= */

const STATE = {
  headIndex: -1,
  topIndex: -1,
  soundEnabled: true,
  teoVoiceEnabled: true, // Controla si TEO habla en voz alta
  isRealPhotoActive: true,
  currentCategoryForSheet: null
};

let currentSkinIndex = 0; // ALWAYS starts on 'Osito'
let skinFallbackAttempt = 0;
let sheetSaveInProgress = false;

// URL del despliegue de Google Apps Script.
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxbFWMuDUdeXFxs93vKQqvv5Vh-JNCqarQcA25QrxLvuNAzPSiGxm3dURUNM1o84DJeMQ/exec';

/* =========================================================================
   AUDIO & SPEECH SYNTHESIZER
   ========================================================================= */
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let currentVoiceAudio = null;

function playTone(freq = 520, type = 'sine', duration = 0.15) {
  if (!STATE.soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function speakTeo(text, audioKey = text) {
  const speechText = document.getElementById('speechText');
  if (speechText) {
    speechText.innerText = text;
  } else {
    const bubble = document.getElementById('teoSpeech');
    if (bubble) bubble.innerText = text;
  }

  const bubble = document.getElementById('teoSpeech');
  if (bubble) {
    bubble.style.transform = 'scale(1.04)';
    setTimeout(() => bubble.style.transform = 'scale(1)', 180);
  }

  playTone(520, 'sine', 0.1);

  if (!STATE.soundEnabled) return;
  if (!STATE.teoVoiceEnabled) return;

  // 1. Intentar reproducir el audio grabado local (.mp3) utilizando la carpeta audio/teo
  const audioSrc = typeof TEO_AUDIO !== 'undefined' ? TEO_AUDIO[audioKey] : null;
  if (audioSrc) {
    if (typeof currentVoiceAudio !== 'undefined' && currentVoiceAudio) {
      currentVoiceAudio.pause();
      currentVoiceAudio.currentTime = 0;
    }
    currentVoiceAudio = new Audio(audioSrc);
    currentVoiceAudio.play().then(() => {
      console.log(`🔊 Reproduciendo audio local: ${audioSrc}`);
    }).catch((err) => {
      console.warn(`No se pudo reproducir el audio ${audioSrc}, usando voz sintética:`, err);
      speakWithSpeechSynthesis(text);
    });
    return;
  }

  // 2. Respaldo por síntesis de voz del navegador si no hay archivo de audio asociado
  speakWithSpeechSynthesis(text);
}

// Función auxiliar para manejar la síntesis de voz nativa de respaldo
function speakWithSpeechSynthesis(text) {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-AR';
      utterance.rate = 0.95;
      utterance.pitch = 1.25;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
    }
  }
}

function toggleTeoVoice(e) {
  if (e) e.stopPropagation();
  STATE.teoVoiceEnabled = !STATE.teoVoiceEnabled;

  const btn = document.getElementById('btnTeoVoiceToggle') || document.getElementById('btnReplayVoice');
  if (btn) {
    btn.innerText = STATE.teoVoiceEnabled ? '🔊' : '🔇';
    btn.title = STATE.teoVoiceEnabled ? 'Silenciar voz de TEO' : 'Activar voz de TEO';
    btn.classList.toggle('muted', !STATE.teoVoiceEnabled);
  }

  if (!STATE.teoVoiceEnabled) {
    if (currentVoiceAudio) currentVoiceAudio.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    showToast('Voz de TEO desactivada 🔇');
  } else {
    showToast('Voz de TEO activada 🔊');
    const speechText = document.getElementById('speechText');
    const txt = speechText ? speechText.innerText : '¡Hola! Soy TEO.';
    speakTeo(txt);
  }
}

function replayCurrentSpeech() {
  toggleTeoVoice();
}

function tapTeo() {
  const phrases = [
    ['¡Un abrazo suave me hace muy feliz! 🤗', 'tap_hug'],
    ['¡Sos mi mejor amigo/a! 💚', 'tap_friend'],
    ['¿Jugamos a cambiarme la ropita?', 'tap_play'],
    ['¡Me gusta mucho cómo combinaste mi ropa!', 'tap_like']
  ];
  const [r, audioKey] = phrases[Math.floor(Math.random() * phrases.length)];
  playTone(680, 'sine', 0.15);
  speakTeo(r, audioKey);
}

/* =========================================================================
   FORM VALIDATION & ONBOARDING SUBMIT
   ========================================================================= */
function checkFormValidity() {
  const inputName = document.getElementById('inputName');
  const inputAge = document.getElementById('inputAge');
  const selectGender = document.getElementById('selectGender');
  const selectProfile = document.getElementById('selectProfile');
  const btnStartGame = document.getElementById('btnStartGame');

  const nameVal = inputName ? inputName.value.trim() : '';
  const ageVal = inputAge ? inputAge.value.trim() : '';
  const genderVal = selectGender ? selectGender.value : '';
  const profileVal = selectProfile ? selectProfile.value : '';

  const isComplete = (nameVal.length > 0) &&
                     (ageVal.length > 0 && !isNaN(ageVal) && Number(ageVal) > 0) &&
                     (genderVal !== '' && genderVal !== null) &&
                     (profileVal !== '' && profileVal !== null);

  if (btnStartGame) {
    btnStartGame.disabled = !isComplete;
  }
}

function submitOnboarding() {
  const inputName = document.getElementById('inputName');
  const inputAge = document.getElementById('inputAge');
  const selectGender = document.getElementById('selectGender');
  const selectProfile = document.getElementById('selectProfile');
  const btnStartGame = document.getElementById('btnStartGame');

  if (btnStartGame && btnStartGame.disabled) return;

  currentChildProfile = {
    name: inputName ? inputName.value.trim() : 'Amigo/a',
    age: inputAge ? inputAge.value.trim() : '',
    gender: selectGender ? selectGender.value : '',
    profile: selectProfile ? selectProfile.value : ''
  };

  const screenOnboarding = document.getElementById('screenOnboarding');
  const screenGame = document.getElementById('screenGame');

  if (screenOnboarding) screenOnboarding.classList.remove('active');
  if (screenGame) screenGame.classList.add('active');

  playTone(523.25, 'triangle', 0.12);
  setTimeout(() => playTone(659.25, 'triangle', 0.12), 100);
  setTimeout(() => playTone(783.99, 'triangle', 0.22), 200);

  const greeting = `¡Hola ${currentChildProfile.name}! Soy TEO. ¡Qué lindo jugar juntos! ✨`;
  speakTeo(greeting, 'greeting');
  showToast(`¡Bienvenido/a, ${currentChildProfile.name}!`);

  const brandDiv = document.querySelector('.brand');
  if (brandDiv && !document.getElementById('userHeaderChip')) {
    const chip = document.createElement('span');
    chip.id = 'userHeaderChip';
    chip.className = 'user-chip-header';
    chip.innerText = `👤 ${currentChildProfile.name}`;
    brandDiv.appendChild(chip);
  }
}

/* =========================================================================
   SKINS SYSTEM
   ========================================================================= */
function cycleSkin(dir) {
  currentSkinIndex = (currentSkinIndex + dir + SKINS_DATA.length) % SKINS_DATA.length;
  applySkin(currentSkinIndex);
}

function applySkin(index, shouldSpeak = true) {
  currentSkinIndex = index;
  const skin = SKINS_DATA[index];
  const display = document.getElementById('skinNameDisplay');
  if (display) display.innerText = skin.name;

  const img = document.getElementById('teoRealPhoto');
  const drawing = document.getElementById('teoDrawingImage');
  if (img) img.src = skin.realPath;
  if (drawing) drawing.src = skin.drawingPath;

  if (STATE.isRealPhotoActive) {
    if (img) img.style.display = 'block';
    if (drawing) drawing.style.display = 'none';
  } else {
    if (img) img.style.display = 'none';
    if (drawing) drawing.style.display = 'block';
  }

  if (shouldSpeak) {
    playTone(520 + (index % 4) * 60, 'sine', 0.12);
    speakTeo(skin.phrase, `skin_${skin.id}`);
    showToast(`Skin: ${skin.name}`);
  }
}

function handleImageSuccess(imgEl) {
  if (STATE.isRealPhotoActive) {
    if (imgEl) imgEl.style.display = 'block';
    const drawing = document.getElementById('teoDrawingImage');
    if (drawing) drawing.style.display = 'none';

    const btn = document.getElementById('btnModeToggle');
    const icon = document.getElementById('modeIcon');
    const text = document.getElementById('modeText');
    if (btn) btn.classList.add('real-active');
    if (icon) icon.innerText = '📷';
    if (text) text.innerText = 'TEO Real';
  } else {
    if (imgEl) imgEl.style.display = 'none';
    const drawing = document.getElementById('teoDrawingImage');
    if (drawing) drawing.style.display = 'block';
  }
}

function handleImageFallback(imgEl) {
  console.warn('No se pudo cargar el asset real de TEO:', SKINS_DATA[currentSkinIndex]?.name);
  if (imgEl) imgEl.style.display = 'none';
  showToast('No se pudo cargar la imagen real de TEO.');
}

/* =========================================================================
   REAL MODE / VECTOR MODE TOGGLE
   ========================================================================= */
function toggleRealMode() {
  setRealMode(!STATE.isRealPhotoActive);
  playTone(500, 'sine', 0.1);
}

function setRealMode(real) {
  STATE.isRealPhotoActive = real;
  const img = document.getElementById('teoRealPhoto');
  const drawing = document.getElementById('teoDrawingImage');
  const btn = document.getElementById('btnModeToggle');
  const icon = document.getElementById('modeIcon');
  const text = document.getElementById('modeText');

  if (real) {
    const skin = SKINS_DATA[currentSkinIndex];
    if (img && skin) {
      skinFallbackAttempt = 0;
      img.src = skin.realPath;
      img.style.display = 'block';
    }
    if (drawing) drawing.style.display = 'none';
    if (btn) btn.classList.add('real-active');
    if (icon) icon.innerText = '📷';
    if (text) text.innerText = 'TEO Real';
    showToast('Modo: TEO Real');
  } else {
    if (img) img.style.display = 'none';
    if (drawing) drawing.style.display = 'block';
    if (btn) btn.classList.remove('real-active');
    if (icon) icon.innerText = '🎨';
    if (text) text.innerText = 'TEO Dibujo';
    showToast('Modo: Dibujo');
  }
}

/* =========================================================================
   CLOTHING NAVIGATION & LAYERS
   ========================================================================= */
function cycleCategory(category, direction) {
  const list = ITEMS_DATA[category];
  const prop = category + 'Index';
  let curr = STATE[prop];

  if (curr === -1) {
    curr = (direction > 0) ? 0 : (list.length - 1);
  } else {
    curr += direction;
    if (curr >= list.length) {
      curr = -1;
    } else if (curr < -1) {
      curr = list.length - 1;
    }
  }

  STATE[prop] = curr;
  playTone(520 + direction * 70, 'triangle', 0.12);
  updateAppView();

  if (curr >= 0) {
    const item = list[curr];
    speakTeo(item.phrase, item.id.replace('-', '_'));
    showToast(`¡TEO se probó: ${item.name}!`);
  } else {
    speakTeo('Listo, me saqué esa prenda.', 'remove');
    showToast('Prenda quitada');
  }
}

function updateAppView() {
  const setLayer = (layer, item) => {
    layer.innerHTML = '';
    if (item) {
      const image = document.createElement('img');
      image.src = item.assetPath;
      image.alt = item.name;
      image.draggable = false;
      image.onerror = () => {
        layer.innerHTML = '';
        layer.className = 'clothing-layer empty';
        showToast(`No se pudo cargar ${item.name}.`);
      };
      layer.appendChild(image);
      layer.className = 'clothing-layer active';
    } else {
      layer.className = 'clothing-layer empty';
    }
  };

  const layerHead = document.getElementById('layerHead');
  const pillHead = document.getElementById('pillHead');
  const pillHeadTxt = document.getElementById('pillHeadTxt');

  if (STATE.headIndex >= 0) {
    const it = ITEMS_DATA.head[STATE.headIndex];
    setLayer(layerHead, it);
    if(pillHead) pillHead.classList.add('active');
    if(pillHeadTxt) pillHeadTxt.innerText = it.name;
  } else {
    if(layerHead) {
      layerHead.innerHTML = '';
      layerHead.className = 'clothing-layer empty';
    }
    if(pillHead) pillHead.classList.remove('active');
    if(pillHeadTxt) pillHeadTxt.innerText = 'Accesorio';
  }

  const layerTop = document.getElementById('layerTop');
  const pillTop = document.getElementById('pillTop');
  const pillTopTxt = document.getElementById('pillTopTxt');

  if (STATE.topIndex >= 0) {
    const it = ITEMS_DATA.top[STATE.topIndex];
    setLayer(layerTop, it);
    if(pillTop) pillTop.classList.add('active');
    if(pillTopTxt) pillTopTxt.innerText = it.name;
  } else {
    if(layerTop) {
      layerTop.innerHTML = '';
      layerTop.className = 'clothing-layer empty';
    }
    if(pillTop) pillTop.classList.remove('active');
    if(pillTopTxt) pillTopTxt.innerText = 'Remera';
  }
}

/* =========================================================================
   BOTTOM SHEET CATALOG
   ========================================================================= */
function openSheet(category) {
  STATE.currentCategoryForSheet = category;
  playTone(480, 'sine', 0.1);

  const overlay = document.getElementById('sheetOverlay');
  const titleEl = document.getElementById('sheetTitle');
  const grid = document.getElementById('sheetGrid');

  const titles = {
    head: '🧢 Sombreros y Accesorios (10)',
    top: '👕 Remeras y Partes de Arriba (10)'
  };

  if(titleEl) titleEl.innerText = titles[category] || 'Prendas';
  if(grid) grid.innerHTML = '';

  const list = ITEMS_DATA[category];
  const activeIdx = STATE[category + 'Index'];

  const removeBtn = document.createElement('div');
  removeBtn.className = 'card-remove-action';
  removeBtn.innerHTML = `<span>🔄</span> <span>Dejar a TEO sin ${category === 'head' ? 'accesorio' : 'remera'}</span>`;
  removeBtn.onclick = () => {
    STATE[category + 'Index'] = -1;
    updateAppView();
    closeSheetDirect();
    speakTeo('Listo, me saqué esa prenda.', 'remove');
    showToast('Prenda quitada');
  };
  if(grid) grid.appendChild(removeBtn);

  list.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = `modal-clothing-card ${activeIdx === index ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="card-svg-thumb"><img src="${item.assetPath}" alt="${item.name}"></div>
      <div class="card-title-text">${item.name}</div>
    `;
    card.onclick = () => {
      STATE[category + 'Index'] = index;
      updateAppView();
      closeSheetDirect();
      playTone(587.33, 'triangle', 0.15);
      setTimeout(() => playTone(880, 'sine', 0.2), 80);
      speakTeo(item.phrase, item.id.replace('-', '_'));
      showToast(`¡TEO se puso: ${item.name}!`);
    };
    if(grid) grid.appendChild(card);
  });

  if(overlay) overlay.classList.add('open');
}

function closeSheet(e) {
  if (e.target.id === 'sheetOverlay') {
    closeSheetDirect();
  }
}

function closeSheetDirect() {
  playTone(400, 'sine', 0.08);
  const overlay = document.getElementById('sheetOverlay');
  if (overlay) overlay.classList.remove('open');
}

/* =========================================================================
   CONFIRM CUSTOMIZATION MODAL & GOOGLE SHEETS SAVE
   ========================================================================= */
function confirmCustomization() {
  playTone(523.25, 'triangle', 0.12);
  setTimeout(() => playTone(659.25, 'triangle', 0.12), 100);
  setTimeout(() => playTone(783.99, 'triangle', 0.15), 200);
  setTimeout(() => playTone(1046.50, 'triangle', 0.3), 320);

  const skin = SKINS_DATA[currentSkinIndex];
  const summarySkinEl = document.getElementById('summarySkin');
  if (summarySkinEl) summarySkinEl.innerText = skin ? skin.name : 'Osito';

  const summaryModeEl = document.getElementById('summaryMode');
  if (summaryModeEl) {
    summaryModeEl.innerText = STATE.isRealPhotoActive ? '📷 TEO Real (Foto)' : '🎨 TEO Dibujo (Ilustración)';
  }

  const headItem = (STATE.headIndex >= 0) ? ITEMS_DATA.head[STATE.headIndex].name : 'Sin accesorio';
  const summaryHeadEl = document.getElementById('summaryHead');
  if(summaryHeadEl) summaryHeadEl.innerText = headItem;

  const topItem = (STATE.topIndex >= 0) ? ITEMS_DATA.top[STATE.topIndex].name : 'Sin remera';
  const summaryTopEl = document.getElementById('summaryTop');
  if(summaryTopEl) summaryTopEl.innerText = topItem;

  saveCustomizationToGoogleSheet({
    Nombre: currentChildProfile.name,
    Edad: currentChildProfile.age,
    Género: currentChildProfile.gender,
    Perfil: currentChildProfile.profile,
    Skin: skin ? skin.name : 'Osito',
    Sombrero: headItem,
    Remera: topItem
  });

  const modal = document.getElementById('confirmModalOverlay');
  if (modal) modal.classList.add('open');

  speakTeo('¡Me encanta cómo quedé! ¡Muchas gracias por vestirme tan lindo! 🤗', 'confirmed');
  showToast('¡Personalización confirmada! ✨');
}

async function saveCustomizationToGoogleSheet(data) {
  if (!GOOGLE_SHEETS_WEB_APP_URL || sheetSaveInProgress) return;

  sheetSaveInProgress = true;
  try {
    await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    showToast('Datos guardados en Google Sheets ✅');
  } catch (error) {
    console.warn('[Google Sheets] No se pudieron guardar los datos:', error);
    showToast('No se pudieron guardar los datos');
  } finally {
    sheetSaveInProgress = false;
  }
}

function closeConfirmModal(e) {
  if (e.target.id === 'confirmModalOverlay') {
    closeConfirmModalDirect();
  }
}

function closeConfirmModalDirect() {
  playTone(420, 'sine', 0.1);
  const modal = document.getElementById('confirmModalOverlay');
  if (modal) modal.classList.remove('open');
}

// Descargar foto de recuerdo MANTENIENDO el modal abierto para poder volver a descargar o reiniciar
function downloadFromConfirm() {
  exportTeoPhotoDirectly();
}

function exportTeoPhotoDirectly() {
  playTone(800, 'triangle', 0.2);
  
  const canvas = document.getElementById('snapshotCanvas');
  if (!canvas) {
    showToast('No se encontró el lienzo para la foto.');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 1. Fondo y Marco estético
  ctx.fillStyle = '#F0F7FF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
  
  // 2. Título superior
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 30px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('¡Mi Amigo TEO!', canvas.width / 2, 65);

  // Coordenadas base para TEO
  const rx = 160;
  const ry = 110;
  const rw = 320;
  const rh = 420;

  const source = STATE.isRealPhotoActive
    ? document.getElementById('teoRealPhoto')
    : document.getElementById('teoDrawingImage');

  const activeTopImg = document.querySelector('#layerTop img');
  const activeHeadImg = document.querySelector('#layerHead img');

  const finalizeExport = () => {
    ctx.font = '600 15px "Fredoka", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Proyecto Final de Carrera - UNLaM', canvas.width / 2, 690);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Mi_TEO_${currentChildProfile.name || 'Personalizado'}_${Date.now()}.png`;
      link.href = dataUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('📸 ¡Foto de recuerdo descargada con éxito!');
    } catch (e) {
      console.error('Error al exportar la foto:', e);
      showToast('No se pudo generar la foto.');
    }
  };

  if (source && source.src) {
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.onload = () => {
      // Dibujar la base de TEO
      ctx.drawImage(baseImg, rx, ry, rw, rh);

      // Dibujar remera con dimensiones exactas
      if (activeTopImg && activeTopImg.src) {
        const topImg = new Image();
        topImg.crossOrigin = 'anonymous';
        topImg.onload = () => {
          ctx.drawImage(topImg, rx, ry, rw, rh);
          drawHeadAccessory();
        };
        topImg.onerror = () => drawHeadAccessory();
        topImg.src = activeTopImg.src;
      } else {
        drawHeadAccessory();
      }
    };
    baseImg.src = source.src;
  }

  function drawHeadAccessory() {
    if (activeHeadImg && activeHeadImg.src) {
      const headImg = new Image();
      headImg.crossOrigin = 'anonymous';
      headImg.onload = () => {
        // Reducimos ligeramente el tamaño y ajustamos la posición vertical de la corona/gorro
        // para que no tape la cara y encaje perfecto arriba
        const accessoryOffset = 10;
        ctx.drawImage(headImg, rx, ry - accessoryOffset, rw, rh);
        finalizeExport();
      };
      headImg.onerror = () => finalizeExport();
      headImg.src = activeHeadImg.src;
    } else {
      finalizeExport();
    }
  }
}

function restartAndPlayAgain() {
  closeConfirmModalDirect();

  STATE.headIndex = -1;
  STATE.topIndex = -1;
  updateAppView();

  applySkin(0);

  playTone(440, 'triangle', 0.15);
  setTimeout(() => playTone(660, 'sine', 0.2), 100);
  speakTeo('¡Genial! ¡Vamos a jugar otra vez! ✨', 'restart');
  showToast('¡Listo para jugar una vez más!');
}

/* =========================================================================
   PHOTO EXPORT SYSTEM (CANVAS FALLBACK)
   ========================================================================= */
function exportTeoPhoto() {
  playTone(800, 'triangle', 0.2);
  const canvas = document.getElementById('snapshotCanvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#F0F7FF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 30px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('¡Mi Amigo TEO!', canvas.width / 2, 65);

  const source = STATE.isRealPhotoActive
    ? document.getElementById('teoRealPhoto')
    : document.getElementById('teoDrawingImage');
  if (!source || !source.complete || !source.naturalWidth) {
    showToast('La imagen de TEO todavía no está lista.');
    return;
  }
  ctx.drawImage(source, 160, 130, 320, 420);

  const layers = [
    document.querySelector('#layerTop img'),
    document.querySelector('#layerHead img')
  ].filter((image) => image && image.complete && image.naturalWidth);
  layers.forEach((image) => ctx.drawImage(image, 160, 130, 320, 420));

  ctx.font = '600 15px "Fredoka", sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Proyecto Final de Carrera - UNLaM', canvas.width / 2, 720);

  const link = document.createElement('a');
  link.download = `Mi_TEO_Personalizado_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('📸 ¡Foto descargada!');
}

function initActions() {
  const btnRandom = document.getElementById('btnRandom');
  if (btnRandom) {
    btnRandom.onclick = () => {
      playTone(659, 'triangle', 0.1);
      setTimeout(() => playTone(880, 'triangle', 0.1), 80);
      setTimeout(() => playTone(1046, 'triangle', 0.2), 160);

      const randomSkinIdx = Math.floor(Math.random() * SKINS_DATA.length);
      applySkin(randomSkinIdx);

      const randomMode = Math.random() < 0.5;
      setRealMode(randomMode);

      STATE.headIndex = Math.floor(Math.random() * ITEMS_DATA.head.length);
      STATE.topIndex = Math.floor(Math.random() * ITEMS_DATA.top.length);
      updateAppView();

      speakTeo('¡Me encanta esta combinación sorpresa! ¡Quedé genial!', 'surprise');
      showToast(`¡Sorpresa! ${SKINS_DATA[randomSkinIdx].name} (${randomMode ? 'Real' : 'Dibujo'})`);
    };
  }

  const btnReset = document.getElementById('btnReset');
  if (btnReset) {
    btnReset.onclick = () => {
      STATE.headIndex = -1;
      STATE.topIndex = -1;
      updateAppView();
      playTone(330, 'sine', 0.2);
      speakTeo('¡Estoy al natural con mi suave peluche!', 'natural');
      showToast('TEO ha vuelto a su estado original');
    };
  }

  const btnSound = document.getElementById('btnSound');
  if (btnSound) {
    btnSound.onclick = () => {
      STATE.soundEnabled = !STATE.soundEnabled;
      if (STATE.soundEnabled) {
        btnSound.innerText = '🔊';
        showToast('Sonido activado');
        playTone(600, 'sine', 0.15);
      } else {
        btnSound.innerText = '🔇';
        showToast('Sonido silenciado');
        if (currentVoiceAudio) currentVoiceAudio.pause();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      }
    };
  }

  const btnSave = document.getElementById('btnSave');
  if (btnSave) btnSave.onclick = exportTeoPhoto;
}

function showToast(message) {
  const toast = document.getElementById('appToast');
  if (toast) {
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }
}

/* =========================================================================
   BOOTSTRAP / INIT
   ========================================================================= */
window.addEventListener('DOMContentLoaded', () => {
  checkFormValidity();
  const realImage = document.getElementById('teoRealPhoto');
  if (realImage) {
    realImage.onload = () => handleImageSuccess(realImage);
    realImage.onerror = () => handleImageFallback(realImage);
  }
  const drawingImage = document.getElementById('teoDrawingImage');
  if (drawingImage) {
    drawingImage.onerror = () => showToast('No se pudo cargar el dibujo de TEO.');
  }
  applySkin(0, false);
  initActions();
});