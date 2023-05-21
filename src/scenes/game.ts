import Phaser from 'phaser';
import {PlayerController} from "./player-controller";

export default class Game extends Phaser.Scene {

  constructor() {
    super('game');
  }

  penguin: Phaser.Physics.Matter.Sprite | undefined;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private onGround = false;
  private playerController: PlayerController | undefined;

  init() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.scene.launch('ui');
  }

  preload() {
    this.load.atlas(
      'penguin',
      'assets/img/sprites/penguin/penguin-moves-sprite.png',
      'assets/img/sprites/penguin/penguin-moves-sprite.json');

    this.load.image('tiles', 'assets/img/winter-scene/sheet.png');
    this.load.image('star', 'assets/img/items/star.png');
    this.load.tilemapTiledJSON('tilemap', 'assets/img/winter-scene/tilemap/iceworld-tilemap.json');
  }

  create() {
    const map = this.make.tilemap({key: 'tilemap'});
    const tileset = map.addTilesetImage('iceworld', 'tiles');

    const ground = map.createLayer('ground', tileset);
    ground.setCollisionByProperty({collides: true});

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
            this.cursors
          );

          this.cameras.main.startFollow(this.penguin, true);

          // this.penguin.setPosition(x + width * 0.5, y - height * 0.5);
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
          break ;
      }
    });

    this.matter.world.convertTilemapLayer(ground);
  }

  update(_t: number, dt: number) {
    if (!this.playerController) return
    this.playerController.update(dt);
  }
}
