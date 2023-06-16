import Phaser from "phaser";

export const usePenguinAnimation = (
  sprite: Phaser.Physics.Matter.Sprite,
) => {
    sprite.anims.create({
      key: 'penguin-idle',
      frames: [{
        key: 'penguin',
        frame: 'penguin_walk01.png',
      }],
    });

    sprite.anims.create({
      key: 'penguin-walk',
      frames: sprite.anims.generateFrameNames('penguin', {
        start: 1,
        end: 4,
        prefix: 'penguin_walk0',
        suffix: '.png',
      }),
      frameRate: 10,
      repeat: -1,
    });

    sprite.anims.create({
      key: 'penguin-jump',
      frames: sprite.anims.generateFrameNames('penguin', {
        start: 1,
        end: 3,
        prefix: 'penguin_jump0',
        suffix: '.png',
      }),
      frameRate: 10,
      repeat: -1,
    });

    sprite.anims.create({
      key: 'penguin-die',
      frames: sprite.anims.generateFrameNames('penguin', {
        start: 1,
        end: 3,
        prefix: 'penguin_die0',
        suffix: '.png',
      }),
      frameRate: 10,
      repeat: 0,
    });
}