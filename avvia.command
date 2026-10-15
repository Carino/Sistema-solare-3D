#!/bin/bash
cd "$(dirname "$0")"

echo "=================================================="
echo "   Avvio del Sistema Solare 3D in corso...       "
echo "=================================================="

# Se npm è disponibile, usa l'ambiente di sviluppo Vite
if command -v npm >/dev/null 2>&1; then
    echo "Avvio tramite Vite (npm)..."
    npm start
    exit 0
fi

# Altrimenti usa il server Python 3 integrato (già presente sul sistema) con la cartella dist
PYTHON=""
for candidate in python3 python; do
    if command -v "$candidate" >/dev/null 2>&1; then
        PYTHON="$candidate"
        break
    fi
done

if [ -n "$PYTHON" ] && [ -d "dist" ]; then
    PORT=5173
    echo "Python rilevato: $($PYTHON --version)"
    echo "Avvio server locale su http://localhost:$PORT ..."
    echo ""
    echo "Premi Ctrl+C in questa finestra per terminare il programma."
    echo "=================================================="
    echo ""

    # Apre automaticamente il browser quando il server parte
    (sleep 1 && open "http://localhost:$PORT") &

    $PYTHON -m http.server $PORT --directory dist
    exit 0
fi

echo "❌ Errore: per avviare il simulatore è necessario installare Node.js (https://nodejs.org) oppure Python 3."
read -p "Premi Invio per chiudere..."

