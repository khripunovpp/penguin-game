import StateMachine from "../state-machine/state-machine";

export class PlayerController {
  constructor(
    sprite: Phaser.Physics.Matter.Sprite,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys
  ) {
    this.sprite = sprite;
    this.cursors = cursors;

    this._createAnimations();
    this.stateMachine = new StateMachine(this, 'player-controller');

    this.stateMachine.addState('idle', {
      onEnter: this._idleOnEnter,
      onUpdate: this._idleOnUpdate,
    })
      .addState('walk', {
        onEnter: this._walkOnEnter,
        onUpdate: this._walkOnUpdate,
      })
      .addState('jump', {
        onEnter: this._jumpOnEnter,
        onUpdate: this._jumpOnUpdate,
      })
      .setState('idle');


    this.sprite.setOnCollide(() => {
      if (this.stateMachine?.isCurrentState('jump')) {
        this.stateMachine?.setState('idle');
      }
    })

  }

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private sprite: Phaser.Physics.Matter.Sprite;
  private stateMachine: StateMachine | undefined;

  update(dt: number) {
    this.stateMachine?.update(dt);
  }

  private _walkOnEnter() {
    this.sprite?.play('penguin-walk');
  }

  private _walkOnUpdate() {
    const speed = 4;
    if (this.cursors.left?.isDown) {
      this.sprite.flipX = true;
      this.sprite.setVelocityX(-speed);
    } else if (this.cursors.right?.isDown) {
      this.sprite.flipX = false;
      this.sprite.setVelocityX(speed);
    } else {
      this.sprite.setVelocityX(0);
      this.stateMachine?.setState('idle');
    }

    const didPressJump = Phaser.Input.Keyboard.JustDown(this.cursors.space);

    if (didPressJump) {
      this.stateMachine?.setState('jump');
    }
  }

  private _jumpOnEnter() {
    this.sprite.setVelocityY(-15);
    this.sprite.play('penguin-jump');
  }

  private _jumpOnUpdate() {
    const speed = 4;
    if (this.cursors.left?.isDown) {
      this.sprite.setVelocityX(-speed);
    } else if (this.cursors.right?.isDown) {
      this.sprite.setVelocityX(speed);
    }
  }

  private _idleOnEnter() {
    this.sprite?.play('penguin-idle');
  }

  private _idleOnUpdate() {
    if (this.cursors.left?.isDown || this.cursors.right?.isDown) {
      this.stateMachine?.setState('walk');
    }

    const didPressJump = Phaser.Input.Keyboard.JustDown(this.cursors.space);

    if (didPressJump) {
      this.stateMachine?.setState('jump');
    }
  }

  private _createAnimations() {
    this.sprite?.anims.create({
      key: 'penguin-idle',
      frames: [{
        key: 'penguin',
        frame: 'penguin_walk01.png',
      }],
    });

    this.sprite?.anims.create({
      key: 'penguin-walk',
      frames: this.sprite?.anims.generateFrameNames('penguin', {
        start: 1,
        end: 4,
        prefix: 'penguin_walk0',
        suffix: '.png',
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.sprite?.anims.create({
      key: 'penguin-jump',
      frames:this.sprite?.anims.generateFrameNames('penguin', {
        start: 1,
        end: 3,
        prefix: 'penguin_jump0',
        suffix: '.png',
      }),
      frameRate: 10,
      repeat: -1,
    })
  }
}