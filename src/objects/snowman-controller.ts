import StateMachine from "../state-machine/state-machine";
import {sharedInstance as events} from "./../services/event-center";

export default class SnowmanController {
  constructor(
    sprite: Phaser.Physics.Matter.Sprite,
    scene: Phaser.Scene,
  ) {
    this.sprite = sprite;
    this.scene = scene;

    this._createAnimations();

    this.stateMachine = new StateMachine(this, 'snowman-controller');

    this.stateMachine.addState('idle', {
      onEnter: this._idleOnEnter,
    })
      .addState('left', {
        onEnter: this._leftOnEnter,
        onUpdate: this._leftOnUpdate,
      })
      .addState('right', {
        onEnter: this._rightOnEnter,
        onUpdate: this._rightOnUpdate,
      })
      .setState('idle');

    events.on('snowman-stomped', this._onSnowmanStomped, this);
  }

  sprite: Phaser.Physics.Matter.Sprite | undefined;
  scene: Phaser.Scene | undefined;
  stateMachine: StateMachine | undefined;
  actionTime: number = 0;
  actionDuration: number = 2000;

  update(dt: number) {
    this.stateMachine?.update(dt);
  }

  destroy() {
    events.off('snowman-stomped', this._onSnowmanStomped, this);
  }

  private _idleOnEnter() {
    this.sprite?.anims.play('idle');
    const random = Phaser.Math.Between(0, 100);

    console.log(random);

    if (random > 50) {
      this.stateMachine?.setState('left');
    } else {
      this.stateMachine?.setState('right');
    }
  }

  private _leftOnEnter() {
    this.actionTime = 0;
    this.sprite?.anims.play('move-left');
  }

  private _leftOnUpdate(
    dt: number,
  ) {

    if (!this.sprite?.body) return;
    this.actionTime += dt;
    this.sprite?.setVelocityX(-2);

    if (this.actionTime > this.actionDuration) {
      this.stateMachine?.setState('right');
    }

  }

  private _rightOnEnter() {
    this.actionTime = 0;
    this.sprite?.anims.play('move-right');
  }

  private _rightOnUpdate(
    dt: number,
  ) {

    if (!this.sprite?.body) return;
    this.actionTime += dt;
    this.sprite?.setVelocityX(2);

    if (this.actionTime > this.actionDuration) {
      this.stateMachine?.setState('left');
    }

  }

  private _onSnowmanStomped(
    snowman: Phaser.Physics.Matter.Sprite,
  ) {
    if (this.sprite !== snowman) {
      return;
    }

    this.sprite?.setVelocity(0, 0);

    events.off('snowman-stomped', this._onSnowmanStomped, this);

    this.scene?.tweens.add({
      targets: this.sprite,
      displayHeight: 0,
      y: this.sprite.y + this.sprite.displayHeight / 2,
      onComplete: () => {
        this.sprite?.destroy();
      }
    })

    this.stateMachine?.setState('die');
  }

  private _createAnimations() {
    this.scene?.anims.create({
      frames: [{
        key: 'idle',
        frame: 'snowman_left_1.png',
      }],
    });

    this.scene?.anims.create({
      key: 'move-left',
      frames: this.scene?.anims.generateFrameNames('snowman', {
        start: 1,
        end: 2,
        prefix: 'snowman_left_',
        suffix: '.png',
      }),
      repeat: -1,
      frameRate: 5,
    });

    this.scene?.anims.create({
      key: 'move-right',
      frames: this.scene?.anims.generateFrameNames('snowman', {
        start: 1,
        end: 2,
        prefix: 'snowman_right_',
        suffix: '.png',
      }),
      repeat: -1,
      frameRate: 5,
    });


  }
}
