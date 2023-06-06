import Phaser from 'phaser';
import {sharedInstance as events} from "./event-center";

export default class UI extends Phaser.Scene {
  constructor() {
    super({
      key: 'ui',
    });
  }

  private graphics!: Phaser.GameObjects.Graphics;
  private starsLabel!: Phaser.GameObjects.Text | undefined;
  private healthLabel!: Phaser.GameObjects.Text | undefined;
  private starsCollected: number = 0;
  private healthLevel: number = 0;
  private healthBarWidth: number = 200;

  init() {
    this.starsCollected = 0;
    this.healthLevel = 100;
  }

  create() {
    this.graphics = this.add.graphics();
    this._addStarsLabel();
    this._addHealthLabel(this.healthLevel);

    events.on('health-collected', this._onHealthCollected, this);

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      events.off('star-collected', this._onStarCollected, this);
      events.off('health-collected', this._onHealthCollected, this);
    })
  }

  private _addStarsLabel() {
    this.starsLabel = this.add.text(
      10,
      40,
      'Stars score: 0',
      {
        fontSize: '24px',
      });

    events.on('star-collected', this._onStarCollected, this);
  }

  private _addHealthLabel(
    percents: number,
  ) {
    const percent = Phaser.Math.Clamp(percents,0,100);
    console.log({
      percent
    })
    this.healthLevel = percent;
    this.graphics.clear();
    this.graphics.fillStyle(0xffffff, 1);
    this.graphics.fillRoundedRect(10, 10, this.healthBarWidth, 20, 5);
    if (percent > 0) {
      this.graphics.fillStyle(0x00ff00, 1);
      this.graphics.fillRoundedRect(10, 10, this.healthBarWidth * percent / 100, 20, 5);
    }

    // this.healthLabel = this.add.text(
    //   10,
    //   50,
    //   'Health score: 100',
    //   {
    //     fontSize: '24px',
    //   });

  }


  private _onStarCollected() {
    this.starsCollected += 1;
    this.starsLabel?.setText(`Stars score: ${this.starsCollected}`);
  }

  private _onHealthCollected(
    value: number,
  ) {
    this.tweens.addCounter({
      from: this.healthLevel,
      to: value,
      duration: 100,
      ease: Phaser.Math.Easing.Sine.InOut,
      onUpdate: (tween) => {
        const value = tween.getValue();
        this._addHealthLabel(value);
      }
    })
  }

}