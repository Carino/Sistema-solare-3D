# Sistema Solare 3D & Simulatore di Fisica Gravitazionale

Applicazione web 3D interattiva e scientifica realizzata con **Three.js** e **Vite**, che modella l'intero Sistema Solare con tutti i corpi celesti principali, le loro dimensioni, masse, rotazioni proprie e rivoluzioni orbitali regolate dalle leggi della fisica newtoniana e kepleriana.

## 🚀 Caratteristiche Principali

1. **Rappresentazione 3D Completa**:
   - **Sole** con bagliore/corona solare (sprite ad emissione radiale) e luce omnidirezionale.
   - **Tutti i pianeti**: Mercurio, Venere, Terra (con rotazione differenziale delle nubi trasparenti e alone atmosferico azzurro), Luna, Marte, Giove (con Grande Macchia Rossa), Saturno (con spettacolari anelli e Divisione di Cassini), Urano (con inclinazione assiale di 98° e anelli), Nettuno e Plutone.
   - **Texture procedurali ad alta definizione**: generate via canvas HTML5 per garantire prestazioni eccellenti, caricamento istantaneo e nessun errore di risorse esterne.
   - **Sfondo cosmico**: oltre 14.000 stelle particellari con variazioni spettrali di colore e nubi di nebulosa cosmica.

2. **Navigazione 3D con Mouse & Tastiera (Frecce & Zoom)**:
   - **Tasti Freccia Tastiera (◄ ▲ ▼ ►)**: Ruota la visuale attorno al sistema solare o al pianeta selezionato in modo fluido e continuo.
   - **Zoom da Tastiera**:
     - Tasti **`+`** e **`−`** (oppure **`W`** e **`S`** / **`PageUp`** e **`PageDown`**).
     - **`Shift + Freccia Su`** per Zoom Avanti, **`Shift + Freccia Giù`** per Zoom Indietro.
     - Selettore **Modalità Frecce ▲/▼** a schermo: permette di impostare direttamente le frecce su/giù per inclinare la visuale o per zoomare.
   - **D-Pad & Pulsanti Zoom a Schermo**: controller fluttuante touch/mouse nell'angolo inferiore sinistro con pulsanti freccia (▲, ▼, ◄, ►), pulsanti zoom (+ / −) e pulsante di ripristino centrale (⟲). È possibile sia cliccare che tenere premuto con il mouse per muoversi fluidamente.
   - **Mouse**:
     - **Tasto sinistro**: trascina per ruotare liberamente l'ambiente su tutti gli assi.
     - **Rotellina del mouse**: zoom continuo fluido.
     - **Tasto destro**: pan e traslazione laterale della telecamera.
   - **Raycasting interattivo**: clicca direttamente su qualsiasi pianeta nello spazio 3D per selezionarlo e centrarlo.

3. **Fisica Gravitazionale & Modifica Dinamica della Massa**:
   - **Legge di Gravitazione Universale di Newton**:
     $$F = G \frac{m_1 m_2}{r^2} \quad \implies \quad \vec{a}_i = \sum_{j \neq i} G \frac{m_j}{|\vec{r}_{ij}|^3} (\vec{r}_j - \vec{r}_i)$$
   - **Modifica della Massa in Tempo Reale**:
     - Slider continuo (da $0.05\times$ a $10.0\times$) e pulsanti preset rapidi per ciascun corpo celeste.
     - Se aumenti la massa del Sole, l'attrazione gravitazionale aumenta: le orbite si stringono e accelerano.
     - Se riduci la massa del Sole o aumenti la massa di un pianeta gigante come Giove, le perturbazioni gravitazionali modificano le orbite dei corpi limitrofi.
   - **Pulsante "Stabilizza Orbita" ($v = \sqrt{GM/r}$)**: ricalcola all'istante la velocità tangenziale per mantenere un'orbita circolare stabile con la nuova massa.
   - **Tre Motori di Simulazione Selezionabili**:
     - **🔭 Newton Reale (Masse Proporzionali Reali)**: simulazione numerica Verlet N-Corpi con le proporzioni astronomiche reali delle masse rispetto al Sole (Sole = 8000, Terra = 0.024, Giove = 7.64). Le orbite dei pianeti sono stabili per sempre e mostrano le deboli e realistiche perturbazioni gravitazionali reciproche.
     - **🌌 Newton N-Corpi (Sandbox Caotico)**: simulazione numerica Verlet N-Corpi con masse grafiche amplificate (Giove = 760, Terra = 24), ideale per sperimentare forti perturbazioni, collisioni ed effetti fionda gravitazionale quando si alterano le masse.
     - **🪐 Dinamica Kepleriana**: orbite geometricamente chiuse e analitiche con velocità e periodo aggiornati dinamicamente dalla 3ª legge di Keplero e dalla legge di gravitazione universale.

4. **Telemetria Scientifica in Tempo Reale**:
   - Massa effettiva in kg ($10^{24}$ kg) e massa simulata.
   - Velocità orbitale istantanea ($km/s$).
   - Periodo di rivoluzione orbitale (giorni o anni).
   - Accelerazione di gravità alla superficie ($m/s^2$) e rapporto con la gravità terrestre ($g$).
   - Forza gravitazionale netta verso il Sole in Newton.
   - Distanza in Unità Astronomiche ($AU$) e milioni di chilometri.
   - Velocità di fuga ($km/s$).

5. **Etichette con Nomi 3D (Controllo Globale e Singolo)**:
   - **Etichette 3D Fluttuanti**: ciascun corpo celeste (Sole, Mercurio, Venere, Terra, Luna, Marte, Giove, Saturno, Urano, Nettuno, Plutone) possiede un'etichetta dinamica in sovrimpressione 3D con indicatore cromatico, nome e pulsante rapido di chiusura `✕` al passaggio del mouse.
   - **Selezione Rapida 3D**: facendo clic sull'etichetta di un corpo celeste nello spazio, la telecamera e l'ispettore si sintonizzano all'istante su quel corpo.
   - **Attivazione/Disattivazione Singola dall'Ispettore**: nel pannello laterale di ciascun pianeta è presente il selettore *"Etichetta Nome 3D: Visibile / Nascosto"*, che permette di accendere o spegnere il nome di quel singolo corpo.
   - **Pannello Popover "🏷️ Singoli"**: nella barra inferiore, accanto alla casella *"Nomi"*, il pulsante *"🏷️ Singoli"* apre un pannello dedicato con interruttori individuali per ogni corpo celeste, contatore delle etichette attive (es. `11/11`) e pulsanti rapidi *"Mostra Tutti"* e *"Nascondi Tutti"*.
   - **Interruttore Globale "Nomi"**: attiva o disattiva istantaneamente tutti i nomi del sistema solare mantenendo memorizzate le preferenze singole.

6. **Controlli Telecamera**:
   - **Libera**: controllo completo con mouse.
   - **Panoramica**: visuale dall'alto ad angolo sul sistema solare.
   - **Zenit 2D**: proiezione perpendicolare al piano dell'eclittica.
   - **Segui**: telecamera agganciata al pianeta selezionato durante la sua rivoluzione.

7. **Schermo Intero & Visibilità Tendina di Destra**:
   - **Schermo Intero (Fullscreen)**: pulsante `⛶ Schermo Intero` nella barra superiore (oppure tasto **`F`** della tastiera) per immergersi a pieno schermo nella simulazione 3D ad alta definizione.
   - **Chiusura / Apertura Tendina Info**:
     - Pulsante `✕` nella testata dell'ispettore.
     - Pulsante `📊 Chiudi Info / Apri Info` nella barra superiore.
     - Tasto **`I`** sulla tastiera per alternare istantaneamente la visuale.
     - Quando la tendina è chiusa, compare una discreta **linguetta laterale destra** (`◀ [Nome Pianeta]`) che permette di riaprirla con un solo clic.

## 💻 Come Avviare l'Applicazione

Nel terminale, all'interno della cartella:
```bash
npm run dev
```
Apri il browser all'indirizzo [http://localhost:5173/](http://localhost:5173/).
