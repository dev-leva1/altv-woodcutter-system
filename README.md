# 🌳 Woodcutter Job for alt:V

A dynamic woodcutting job system for alt:V multiplayer modification for GTA V.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![alt:V](https://img.shields.io/badge/alt:V-compatible-brightgreen.svg)

## 🎮 Features

- 🌲 Dynamic tree locations
- 💰 Earning system ($150 per tree)
- ⚡ Interactive minigame
- 🎯 Real-time animations
- 🗺️ GPS waypoint system
- 📊 Progress tracking
- 🎨 Modern UI design
- 🔊 Sound effects
- 💫 Visual effects

## 🎯 Gameplay

1. Find the Woodcutter NPC (marked on the map)
2. Talk to him to start the job
3. Go to any marked tree location
4. Start the woodcutting minigame
5. Press the indicated key rapidly to cut down the tree
6. Earn money for each successfully cut tree

## 🎮 Minigame Mechanics

- Press the indicated key (E) rapidly
- Fill the progress bar within 5 seconds
- Need 20 successful clicks to complete
- Visual feedback for each hit
- Animated character movements
- Tree falling effects

## 💻 Installation

1. Copy the `woodcutter` folder to your server's `resources` directory
2. Add the following to your `server.toml`:
```toml
resources = [
    'woodcutter'
]
```

## 🔧 Configuration

You can modify the following settings in `server/index.js`:

```javascript
const REWARD_PER_TREE = 150;        // Money reward per tree
const EXPERIENCE_PER_TREE = 10;      // Experience points per tree
const TREE_RESPAWN_TIME = 30000;     // Tree respawn time in ms
```

Tree positions can be modified in the `TREE_POSITIONS` array:
```javascript
const TREE_POSITIONS = [
    { x: -713.7098999023438, y: 5401.39794921875, z: 52.3809814453125 },
    // Add more positions as needed
];
```

## 🎨 Features

### NPC System
- Static NPC with dialogue
- Job information and guidance
- Automatic waypoint setting

### Tree System
- Multiple tree locations
- Respawn timer
- Visual markers
- Map blips

### Minigame
- Modern UI design
- Progress tracking
- Timer system
- Click counter
- Power meter

### Effects
- Tree falling animation
- Particle effects
- Sound effects
- Character animations

## 🤝 Contributing

Feel free to contribute to this project by:
1. Forking the repository
2. Creating a new feature branch
3. Submitting a pull request
