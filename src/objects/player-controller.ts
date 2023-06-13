import StateMachine from "../state-machine/state-machine";
import {sharedInstance as events} from "./../services/event-center";
import ObstaclesController from "./obstacles-controller";

export class PlayerController {
  constructor(
    sprite: Phaser.Physics.Matter.Sprite,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    obstacles: ObstaclesController,
    scene: Phaser.Scene,
  ) {
    this.sprite = sprite;
    this.cursors = cursors;
    this.obstacles = obstacles;
    this.scene = scene;
    this.healthPoints = 100;

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
      .addState('spike-hit', {
        onEnter: this._spikeHitOnEnter,
      })
      .addState('snowman-hit', {
        onEnter: this._snowmanHitOnEnter,
      })
      .addState('snowman-stomp', {
        onEnter: this._snowmanStompOnEnter,
      })
      .addState('dead', {
        onEnter: this._deadOnEnter,
      })
      .setState('idle');


    this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
      const body = data.bodyB as MatterJS.BodyType;
      const gameObject = body.gameObject;

      if (this.obstacles?.is('spikes', body)) {
        this.stateMachine?.setState('spike-hit');
        events.emit('spike-hit');
        return;
      }

      if (this.obstacles?.is('snowman', body)) {
        this.lastSnowman = gameObject;
        if (this.sprite.y < body.position.y) {
          this.stateMachine?.setState('snowman-stomp');
        } else {
          this.stateMachine?.setState('snowman-hit');
        }
        return;
      }

      if (!gameObject) return;

      if (gameObject instanceof Phaser.Physics.Matter.TileBody) {
        if (this.stateMachine?.isCurrentState('jump')) {
          this.stateMachine?.setState('idle');
        }
        return
      }

      const sprite = gameObject as Phaser.Physics.Matter.Sprite;
      const type = sprite.getData('type');

      switch (type) {
        case 'star':
          events.emit('star-collected');
          sprite.destroy();
          break;

        case 'health':
          const value = this.sprite.getData('healthPoints') ?? 10;
          this.healthPoints = Phaser.Math.Clamp(this.healthPoints + value, 0, 100);
          events.emit('health-collected', this.healthPoints);
          sprite.destroy();
          break;
      }
    })

  }

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private sprite: Phaser.Physics.Matter.Sprite;
  private stateMachine: StateMachine | undefined;
  private obstacles: ObstaclesController;
  private scene: Phaser.Scene;
  private healthPoints: number = 100;
  private lastSnowman: Phaser.Physics.Matter.Sprite | undefined;

  update(dt: number) {
    this.stateMachine?.update(dt);
  }

  private _spikeHitOnEnter() {
    this.sprite.setVelocityY(-12);

    const startColor = Phaser.Display.Color.ValueToColor(0xffffff);
    const endColor = Phaser.Display.Color.ValueToColor(0xff0000);

    this.scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 100,
      repeat: 2,
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

        this.sprite.setTint(color);
      },
    })
    this.stateMachine?.setState('idle');
    this._setHealthPoints(this.healthPoints - 10);
  }

  private _snowmanHitOnEnter() {
    if (this.lastSnowman) {
      if (this.sprite.x < this.lastSnowman.x) {
        this.sprite.setVelocityX(-12);
      } else {
        this.sprite.setVelocityX(12);
      }
    } else {
      this.sprite.setVelocityY(-12);
    }


    const startColor = Phaser.Display.Color.ValueToColor(0xffffff);
    const endColor = Phaser.Display.Color.ValueToColor(0x00ff00);

    this.scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 100,
      repeat: 2,
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

        this.sprite.setTint(color);
      },
    })
    this.stateMachine?.setState('idle');

    this._setHealthPoints(this.healthPoints - 10);
  }

  private _snowmanStompOnEnter() {
    this.sprite.setVelocityY(-12);

    events.emit('snowman-stomped', this.lastSnowman);

    this.stateMachine?.setState('idle');
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

  private _deadOnEnter() {
    this.sprite?.setTint(0xff0000);
    this.sprite?.setVelocityY(-12);
    this.sprite?.play('penguin-die');

    this.sprite.setOnCollide(() => {
    });

    this.scene.time.delayedCall(1000, () => {
      this.scene.scene.start('game-over');
    });
  }

  private _setHealthPoints(healthPoints: number) {
    this.healthPoints = Phaser.Math.Clamp(healthPoints, 0, 100);

    events.emit('health-collected', this.healthPoints);

    if (this.healthPoints <= 0) {
      this.stateMachine?.setState('dead');
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
      frames: this.sprite?.anims.generateFrameNames('penguin', {
        start: 1,
        end: 3,
        prefix: 'penguin_jump0',
        suffix: '.png',
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.sprite?.anims.create({
      key: 'penguin-die',
      frames: this.sprite?.anims.generateFrameNames('penguin', {
        start: 1,
        end: 3,
        prefix: 'penguin_die0',
        suffix: '.png',
      }),
      frameRate: 10,
      repeat: 0,
    });
  }
}