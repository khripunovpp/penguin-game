import Phaser from 'phaser';

export default class Game extends Phaser.Scene {

  constructor() {
    super('game');
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
    const map = this.make.tilemap({key: 'tilemap'});
    const tileset = map.addTilesetImage('iceworld', 'tiles');

    map.createLayer('ground', tileset);

    this.cameras.main.scrollY = 300;
  }

  private _addPenguin() {
    const {width, height} = this.scale;

    this.add.image(
      width * 0.5,
      height * 0.5,
      'penguin',
      'penguin-front.png');
  }
}