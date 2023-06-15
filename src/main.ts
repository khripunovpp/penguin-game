import Phaser from 'phaser'
import Game from "./scenes/game";
import UI from "./scenes/ui";
import GameOver from "./scenes/game-over";
import Welcome from "./scenes/welcome";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 500,
  height: 500,
  physics: {
    default: 'matter',
    matter: {
      debug: true,
    },
  },
  scene: [
    Welcome,
    Game,
    UI,
    GameOver,
  ],
  backgroundColor: '#99ead2',
};

const game = new Phaser.Game(config);



export default game;
