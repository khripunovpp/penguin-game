import Phaser from 'phaser';

export default class Game extends Phaser.Scene {

  constructor() {
    super('game');
  }

  penguin: Phaser.Physics.Matter.Sprite | undefined;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private onGround = false;

  init() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  preload() {
    this.load.atlas(
      'penguin',
      'assets/img/sprites/penguin/penguin-moves-sprite.png',
      'assets/img/sprites/penguin/penguin-moves-sprite.json');

    this.load.image('tiles', 'assets/img/winter-scene/sheet.png');
    this.load.tilemapTiledJSON('tilemap', 'assets/img/winter-scene/tilemap/iceworld-tilemap.json');
  }

  create() {
    this._createAnimations();
    const map = this.make.tilemap({key: 'tilemap'});
    const tileset = map.addTilesetImage('iceworld', 'tiles');

    const ground = map.createLayer('ground', tileset);
    ground.setCollisionByProperty({collides: true});

    this.cameras.main.scrollY = 300;


    const objectLayer = map.getObjectLayer('objects');

    objectLayer.objects.forEach(objData => {
      const {x = 0, y = 0, name, width = 0} = objData;
      switch (name) {
        case 'penguin-spawn':

          this.penguin = this.matter.add.sprite(
            x + (width * 0.5),
            y,
            'penguin',
            'penguin-front.png')
            .play('penguin-idle')
            .setFixedRotation()

          this.penguin.setOnCollide(() => {
            this.onGround = true;
          })

          this.cameras.main.startFollow(this.penguin, true);
          // this.penguin.setPosition(x + width * 0.5, y - height * 0.5);
          break;
      }
    });

    this.matter.world.convertTilemapLayer(ground);
  }

  update() {
    if (!this.penguin) return;
    const speed = 4;
    if (this.cursors.left?.isDown) {
      this.penguin.flipX = true;
      this.penguin.setVelocityX(-speed);
      this.penguin.play('penguin-walk', true);
    } else if (this.cursors.right?.isDown) {
      this.penguin.flipX = false;
      this.penguin.setVelocityX(speed);
      this.penguin.play('penguin-walk', true);
    } else {
      this.penguin.setVelocityX(0);
      this.penguin.play('penguin-idle', true);
    }

    const didPressJump = Phaser.Input.Keyboard.JustDown(this.cursors.space);

    if (didPressJump && this.onGround) {
      this.penguin.setVelocityY(-15);
      this.onGround = false;
    }
  }

  private _createAnimations() {
    this.anims.create({
      key: 'penguin-idle',
      frames: [{
        key: 'penguin',
        frame: 'penguin_walk01.png',
      }],
    });

    this.anims.create({
      key: 'penguin-walk',
      frames: this.anims.generateFrameNames('penguin', {
        start: 1,
        end: 4,
        prefix: 'penguin_walk0',
        suffix: '.png',
      }),
      frameRate: 10,
      repeat: -1,
    });
  }
}