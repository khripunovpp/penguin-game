import Phaser from 'phaser';
import {sharedInstance as events} from "./event-center";

export default class UI extends Phaser.Scene {
  constructor() {
    super({
      key: 'ui',
    });
  }

  private starsLabel!: Phaser.GameObjects.Text | undefined;
  private starsCollected: number = 0;

  init() {
    this.starsCollected = 0;
  }

  create() {
    this.starsLabel = this.add.text(
      10,
      10,
      'Stars score: 0',
      {
        fontSize: '24px',
      });

    events.on('star-collected', this._onStarCollected, this);

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      events.off('star-collected', this._onStarCollected, this);
    })
  }

  private _onStarCollected() {
    this.starsCollected += 1;
    this.starsLabel?.setText(`Stars score: ${this.starsCollected}`);
  }
}