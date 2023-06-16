export class TweensHelper {
  static setTint(
    scene: Phaser.Scene,
    sprite: Phaser.Physics.Matter.Sprite,
    color: string,
    repeat: number = 2,
  ) {
    const startColor = Phaser.Display.Color.ValueToColor(0xffffff);
    const endColor = Phaser.Display.Color.ValueToColor(color);

    return scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 100,
      repeat: repeat,
      yoyo: true,
      onUpdate: (tween) => {
        const value = tween.getValue();
        const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
          startColor,
          endColor,
          100,
          value,
        );

        const color = Phaser.Display.Color.GetColor(
          colorObject.r,
          colorObject.g,
          colorObject.b,
        );

        sprite.setTint(color);
      },
    })
  }
}