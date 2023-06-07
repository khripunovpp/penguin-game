import Phaser from 'phaser';
import {PlayerController} from "./player-controller";
import ObstaclesController from "./obstacles-controller";
import SnowmanController from "./snowman-controller";

export default class Game extends Phaser.Scene {

  constructor() {
    super('game');
  }

  penguin: Phaser.Physics.Matter.Sprite | undefined;
  snowman: Phaser.Physics.Matter.Sprite | undefined;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private onGround = false;
  private playerController: PlayerController | undefined;
  private snowmanControllers: SnowmanController[] = [];
  private obstacles!: ObstaclesController | undefined;

  init() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.scene.launch('ui');
    this.obstacles = new ObstaclesController();
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.destroy();
    })
  }

  preload() {
    this.load.atlas(
      'penguin',
      'assets/img/sprites/penguin/penguin-moves-sprite.png',
      'assets/img/sprites/penguin/penguin-moves-sprite.json');

    this.load.atlas(
      'snowman',
      'assets/img/sprites/snowman/snowman-moves-sprite.png',
      'assets/img/sprites/snowman/snowman-moves-sprite.json');

    this.load.image('tiles', 'assets/img/winter-scene/sheet.png');
    this.load.image('star', 'assets/img/items/star.png');
    this.load.image('health', 'assets/img/items/health-pill.png');
    this.load.tilemapTiledJSON('tilemap', 'assets/img/winter-scene/tilemap/iceworld-tilemap.json');
  }

  create() {
    const map = this.make.tilemap({key: 'tilemap'});
    const tileset = map.addTilesetImage('iceworld', 'tiles');

    const ground = map.createLayer('ground', tileset);
    ground.setCollisionByProperty({collides: true});

    const obstacles = map.createLayer('obstacles', tileset);

    this.cameras.main.scrollY = 300;

    const objectLayer = map.getObjectLayer('objects');

    objectLayer.objects.forEach(objData => {
      const {x = 0, y = 0, name, width = 0, height = 0} = objData;
      switch (name) {
        case 'penguin-spawn':

          this.penguin = this.matter.add.sprite(
            x + (width * 0.5),
            y,
            'penguin',
            'penguin-front.png')
            .play('penguin-idle')
            .setFixedRotation();

          this.playerController = new PlayerController(
            this.penguin,
            this.cursors,
            this.obstacles,
            this,
          );

          this.cameras.main.startFollow(this.penguin, true);

          // this.penguin.setPosition(x + width * 0.5, y - height * 0.5);
          break;

        case 'snowman-spawn':
          this.snowman = this.matter.add.sprite(
            x + (width * 0.5),
            y,
            'snowman',
            'snowman-front.png')
            .play('snowman-idle')
            .setFixedRotation();

          this.snowmanControllers.push(new SnowmanController(
            this.snowman,
            this,
          ));

          this.obstacles?.add('snowman', this.snowman.body as MatterJS.BodyType);

          break;

        case 'star':
          const star = this.matter.add.sprite(
            x + (width * 0.5),
            y + (height * 0.5),
            'star',
            undefined,
            {
              isStatic: true,
              isSensor: true,
            }
          );
          star.setData('type', 'star');
          break;

        case 'spikes':
          const spike = this.matter.add.rectangle(
            x + (width * 0.5),
            y + (height * 0.5),
            width,
            height,
            {
              isStatic: true,
              isSensor: true,
            });

          this.obstacles?.add('spikes', spike);

          break;

        case 'health':
          const health = this.matter.add.sprite(
            x + (width * 0.5),
            y + (height * 0.5),
            'health',
            undefined,
            {
              isStatic: true,
              isSensor: true,
            }
          );
          health.setData('type', 'health');
          break;
      }
    });

    this.matter.world.convertTilemapLayer(ground);
  }

  update(_t: number, dt: number) {
    if (!this.playerController) return
    this.playerController.update(dt);

    this.snowmanControllers.forEach(snowmanController => {
      snowmanController.update(dt);
    });
  }

  destroy() {
    this.snowmanControllers.forEach(snowmanController => {
      snowmanController.destroy();
    });
  }
}
