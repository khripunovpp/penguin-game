import Phaser from 'phaser'
import Game from "./scenes/game";
import UI from "./scenes/ui";
import GameOver from "./scenes/game-over";
import Welcome from "./scenes/welcome";
import {controlsService} from "./services/controls-service";
import {Di} from "./services/di";
import {COLLIDE_OBSTACLES_SERVICE} from "./services/di-tokens";
import {collideObstaclesServiceFactory} from "./services/collide-service";

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

const di = new Di();

di.register(COLLIDE_OBSTACLES_SERVICE, collideObstaclesServiceFactory);

controlsService.init();

export default game;
