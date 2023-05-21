import Phaser from 'phaser'
import Game from "./scenes/game";
import UI from "./scenes/ui";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 600,
  height: 600,
  physics: {
    default: 'matter',
    matter: {
      debug: true,
    },
  },
  scene: [
    Game,
    UI,
  ],
}

export default new Phaser.Game(config)
