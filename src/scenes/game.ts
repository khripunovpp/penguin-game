import Phaser from 'phaser';
import SnowmanController from "../objects/snowman-controller";
import {PlayerController} from "../objects/player-controller";
import ObstaclesController from "../objects/obstacles-controller";

/**
 *
 * @param {Phaser.Scene} scene
 * @param {number} totalWidth
 * @param {string} texture
 * @param {number} scrollFactor
 */
const createAligned = (
  scene: Phaser.Scene,
  totalWidth: number,
  texture: string,
  scrollFactor: number = 1,
) => {
  const w = scene.textures.get(texture).getSourceImage().width
  const count = Math.ceil(totalWidth / w) * scrollFactor

  let x = 0
  for (let i = 0; i < count; ++i) {
    const m = scene.add.image(x, scene.scale.height + 200, texture)
      .setOrigin(0, 1)
      .setScrollFactor(scrollFactor, 0)

    x += m.width
  }
}

export default class Game extends Phaser.Scene {

  penguin: Phaser.Physics.Matter.Sprite | undefined;
  snowman: Phaser.Physics.Matter.Sprite | undefined;
  private tileDimensions = {
    width: 70,
    height: 70,
  };
  private tilesX = 100;
  private tilesY = 15;
  private worldWidth = 0;
  private worldHeight = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private playerController: PlayerController | undefined;
  private snowmanControllers: SnowmanController[] = [];
  private obstacles!: ObstaclesController | undefined;
  private platforms!: MatterJS.BodyType[];

  constructor() {
    super('game');
    this.worldWidth = this.tileDimensions.width * this.tilesX;
    this.worldHeight = this.tileDimensions.height * this.tilesY;
  }

  init() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.scene.launch('ui');
    this.obstacles = new ObstaclesController();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy();
    });
    this.platforms = [];
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

    this.load.image('mountains-back', 'assets/img/winter-scene/background/hills.png');
    this.load.image('mountains-mid1', 'assets/img/winter-scene/background/hills-2.png');
    this.load.image('mountains-mid2', 'assets/img/winter-scene/background/hills-3.png');
  }

  create() {
    this.createBackground();
    this.setBounds();
    this.createWorld();
  }

  createWorld() {
    const map = this.make.tilemap({key: 'tilemap'});
    const tileset = map.addTilesetImage('iceworld', 'tiles');

    const ground = map.createLayer('ground', tileset);
    ground.setCollisionByProperty({collides: true});

    map.createLayer('obstacles', tileset);

    const objectLayer = map.getObjectLayer('objects');

    objectLayer.objects.forEach(objData => {
      const {x = 0, y = 0, name, width = 0, height = 0} = objData;
      switch (name) {
        case 'penguin-spawn':
          this.createPenguin(x + (width * 0.5), y);
          break;

        case 'snowman-spawn':
          this.createSnowman(x + (width * 0.5), y);
          break;

        case 'star':
          this.createStar(x + (width * 0.5), y + (height * 0.5));
          break;

        case 'water':
          this.createWater(x + (width * 0.5), y + (height * 0.5), width, height);
          break;

        case 'platform':
          this.createPlatform(x + (width * 0.5), y + (height * 0.5), width, height);
          break;

        case 'spikes':
          this.createSpikes(x + (width * 0.5), y + (height * 0.5), width, height);
          break;

        case 'health':
          this.createHealth(x + (width * 0.5), y + (height * 0.5));
          break;

        case 'level-entrance':
          this.createLevelEntrance(x + (width * 0.5), y + (height * 0.5));
          break;

        case 'level-exit':
          this.createLevelExit(x + (width * 0.5), y + (height * 0.5));
          break;
      }
    });

    this.matter.world.convertTilemapLayer(ground);
  }

  setBounds() {
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.matter.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
  }

  createBackground() {
    createAligned(this, this.worldWidth, 'mountains-back', 0.25)
    createAligned(this, this.worldWidth, 'mountains-mid2', 0.5)
    createAligned(this, this.worldWidth, 'mountains-mid1', 0.75)
  }

  createPenguin(
    x: number,
    y: number,
  ) {
    this.penguin = this.matter.add.sprite(
      x,
      y,
      'penguin',
      'penguin_walk01.png')
      .play('penguin-idle')
      .setFixedRotation();

    this.playerController = new PlayerController(
      this.penguin,
      this.cursors,
      this.obstacles as any,
      this.platforms,
      this,
    );

    this.cameras.main.startFollow(this.penguin, true);
  }

  createSnowman(
    x: number,
    y: number,
  ) {
    this.snowman = this.matter.add.sprite(
      x,
      y,
      'snowman',
      'snowman_left_1.png')
      .play('snowman-idle')
      .setFixedRotation();

    this.snowmanControllers.push(new SnowmanController(
      this.snowman,
      this,
    ));

    this.obstacles?.add('snowman', this.snowman.body as MatterJS.BodyType);
  }

  createStar(
    x: number,
    y: number,
  ) {
    const star = this.matter.add.sprite(
      x,
      y,
      'star',
      undefined,
      {
        isStatic: true,
        isSensor: true,
      }
    );
    star.setData('type', 'star');
  }

  createWater(
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const water = this.matter.add.rectangle(
      x,
      y,
      width,
      height,
      {
        isStatic: true,
        isSensor: true,
      },
    );


    this.obstacles?.add('water', water);
  }

  createPlatform(
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const platform = this.matter.add.rectangle(
      x,
      y,
      width,
      height,
      {
        isStatic: true,
      }
    );

    this.platforms?.push(platform);
  }

  createSpikes(
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const spike = this.matter.add.rectangle(
      x,
      y,
      width,
      height,
      {
        isStatic: true,
        isSensor: true,
      });

    this.obstacles?.add('spikes', spike);
  }

  createHealth(
    x: number,
    y: number,
  ) {
    const health = this.matter.add.sprite(
      x,
      y,
      'health',
      undefined,
      {
        isStatic: true,
        isSensor: true,
      }
    );
    health.setData('type', 'health');
  }

  createLevelEntrance(
    x: number,
    y: number,
  ) {
    const levelEntrance = this.matter.add.sprite(
      x,
      y,
      'level-entrance',
      undefined,
      {
        isStatic: true,
        isSensor: true,
      }
    );
    levelEntrance.setData('type', 'level-entrance');
  }

  createLevelExit(
    x: number,
    y: number,
  ) {
    const levelExit = this.matter.add.sprite(
      x,
      y,
      'level-exit',
      undefined,
      {
        isStatic: true,
        isSensor: true,
      }
    );
    levelExit.setData('type', 'level-exit');
  }

  update(_t: number, dt: number) {
    if (!this.playerController) return
    this.playerController.update(dt);

    this.snowmanControllers.forEach(snowmanController => {
      snowmanController.update(dt);
    });
  }

  destroy() {
    this.scene.stop('ui');
    this.snowmanControllers.forEach(snowmanController => {
      snowmanController.destroy();
    });
  }
}
