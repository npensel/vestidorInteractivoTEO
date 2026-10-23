Esta carpeta contiene las grabaciones locales de TEO.

Voz requerida: es-AR-ElenaNeural (voz femenina argentina de Microsoft Edge TTS).

Para generarlas:

1. Instalar la dependencia: `python -m pip install edge-tts`
2. Ejecutar desde la raíz del proyecto: `python tools/generate-voice-audio.py`

La aplicación reproduce únicamente estos archivos desde `js/voice-audio.js`.
Si falta una grabación local, la aplicación muestra el texto pero no intenta
generar una voz alternativa.
