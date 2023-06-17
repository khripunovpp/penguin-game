import Phaser from "phaser";

export default class Level2 extends Phaser.Scene {
  constructor() {
    super('level2');
  }

  create() {
    const {width, height} = this.scale;

    this.add.text(width * 0.5, height * 0.3, 'Level 2', {
      fontSize: '48px',
    }).setOrigin(0.5);

    const button = this.add.rectangle(width * 0.5, height * 0.5, 450, 100, 0x0000ff, 0.5)
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        this.scene.start('game');
      });

    this.add.text(button.x, button.y, 'Play', {
      fontSize: '48px',
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown-SPACE', () => {
      this.scene.start('game');
    });
  }
}