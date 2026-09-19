# AEON-0 — Autonomous Intelligence Workstation

AEON-0 is a browser-based audiovisual experiment that presents a synthetic trading system as a living digital organism.

A pulsing Three.js connectome acts as the **Intelligence Core**. A continuously generated market feed creates volatility events, those events excite the neural structure, and the resulting activity moves through a visible decision pipeline before a simulated trade appears in the execution ledger.

> **Important:** AEON-0 is a visual simulation. It does not connect to an exchange, use real funds, or place live orders.

## Live concept

**Market movement → Neural impulse → Signal analysis → Risk review → Position sizing → Simulated execution → Settlement → Equity update**

The project is intentionally autonomous after launch. There are no trading controls. The only optional interaction is a single click that unlocks Web Audio in browsers that block autoplay audio.

## Features

- Real-time **Three.js neural connectome / crystal core**
- Autonomous synthetic **AEON / USD** market feed
- Dynamic volatility, momentum and market regimes
- Neural impulses linked to market movement
- Animated decision sequence:
  - `SIGNAL`
  - `RISK REVIEW`
  - `POSITION SIZING`
  - `EXECUTION`
- Simulated autonomous BTC / ETH / SOL trades
- Dynamic starting capital, equity, total profit and win rate
- Rolling five-trade execution ledger
- Autonomous LONG / SHORT bias
- Dynamic position sizing and leverage
- Win/loss settlements with live PnL updates
- Web Audio neural clicks, execution tones and settlement sounds
- Dark wine-red / black cyber-workstation interface
- Responsive single-page layout
- No build process and no package installation

## Run locally

1. Download or clone the repository.
2. Open `index.html` in Chrome, Edge or Firefox.
3. Keep an internet connection available so Three.js can load from the CDN.
4. Click once anywhere in the interface if you want audio.
5. AEON-0 runs autonomously from that point onward.

You can also use a tiny local server if your browser applies stricter `file://` policies:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Deploy with GitHub Pages

1. Create a new GitHub repository.
2. Upload the contents of this repository so `index.html` is in the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your default branch (usually `main`) and `/ (root)`.
6. Save.
7. GitHub will publish the site at your Pages URL after the first deployment finishes.

No build command is required.

## Project structure

```text
AEON-0/
├── index.html
├── styles.css
├── js/
│   ├── 00-base.js
│   ├── 10-audio.js
│   ├── 20-core.js
│   ├── 30-market.js
│   ├── 40-chart.js
│   ├── 50-trading.js
│   └── 60-main.js
├── README.md
├── LICENSE
├── .gitignore
└── .nojekyll
```

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas 2D
- Three.js `0.160.0` loaded from jsDelivr
- Web Audio API

There is no framework, bundler, package manager or backend.

## Simulation model

AEON-0 does **not** claim to predict markets. The price series, signals, risk values, executions and settlements are generated locally for the audiovisual simulation. The displayed PnL is virtual and exists only inside the current browser session.

Reloading the page starts a new session from the configured starting capital.

## Browser notes

For best results, use a recent desktop version of Chrome or Edge with hardware acceleration enabled. WebGL is required for the 3D intelligence core. Audio requires a one-time user gesture because modern browsers block automatic audio playback.

## License

Released under the MIT License. See [`LICENSE`](LICENSE).
