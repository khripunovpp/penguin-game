import StateMachine from "../state-machine/state-machine";
import {sharedInstance as events} from "./../services/event-center";
import ObstaclesController from "./obstacles-controller";
import {controlsService} from "../services/controls-service";

export class PlayerController {

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private sprite: Phaser.Physics.Matter.Sprite;
  private stateMachine: StateMachine | undefined;
  private obstacles: ObstaclesController;
  private scene: Phaser.Scene;
  private healthPoints: number = 100;
  private lastSnowman: Phaser.Physics.Matter.Sprite | undefined;
  private inWater: boolean;
  private platforms: MatterJS.BodyType[];
  private baseHitTintColor: string = '#ff0000';
  private spikeHitHealthPoints: number = 10;
  private spikeHitTintColor: string = this.baseHitTintColor;
  private waterHitHealthPoints: number = 5;
  private waterHitTintColor: string = '#0000ff';
  private snowmanHitHealthPoints: number = 10;
  private snowmanHitTintColor: string = this.baseHitTintColor;
  private walkSpeed: number = 4;
  private jumpSpeed: number = 4;

  constructor(
    sprite: Phaser.Physics.Matter.Sprite,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    obstacles: ObstaclesController,
    platfroms: MatterJS.BodyType[],
    scene: Phaser.Scene,
  ) {
    this.sprite = sprite;
    this.cursors = cursors;
    this.obstacles = obstacles;
    this.scene = scene;
    this.healthPoints = 100;
    this.inWater = false;
    this.platforms = platfroms;
    this.walkSpeed = controlsService.isTouchDevice ? 8 : 4;

    this._createAnimations();
    this.subscribeClickEvents();
    this.stateMachine = new StateMachine(this, 'player-controller');

    this.stateMachine.addState('idle', {
      onEnter: this._idleOnEnter,
      onUpdate: this._idleOnUpdate,
    })
      .addState('walk', {
        onEnter: this._walkOnEnter,
        onUpdate: this._walkOnUpdate,
      })
      .addState('walk-touch-left', {
        onEnter: this._walkOnEnter,
        onUpdate: this._walkTouchLeftOnUpdate,
      })
      .addState('walk-touch-right', {
        onEnter: this._walkOnEnter,
        onUpdate: this._walkTouchRightOnUpdate,
      })
      .addState('jump', {
        onEnter: this._jumpOnEnter,
        onUpdate: this._jumpOnUpdate,
      })
      .addState('spike-hit', {
        onEnter: this._spikeHitOnEnter,
      })
      .addState('water-hit', {
        onEnter: this._waterHitOnEnter,
        onExit: this._waterHitOnExit,
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

    this.sprite.setOnCollideEnd((data: any) => {
      console.log({
        bodyEnd: data.bodyB,
        sprite_y: this.sprite.y,
        body_y: data.bodyB.position.y,
      });

      if (this.obstacles?.is('water', data.bodyB)) {
        this.inWater = data.bodyB.position.y < this.sprite.y;
      }
    });

    this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
      const body = data.bodyB as MatterJS.BodyType;
      const gameObject = body.gameObject;

      if (this.obstacles?.is('spikes', body)) {
        this.stateMachine?.setState('spike-hit');
        events.emit('spike-hit');
        return;
      }

      if (this.obstacles?.is('water', body)) {
        this.inWater = true;
        console.log({
          body,
          sprite_y: this.sprite.y,
          body_y: body.position.y,
        });
        this.stateMachine?.setState('water-hit');
        events.emit('water-hit');
        return;
      }

      if (this.platforms?.includes(body)) {
        this.stateMachine?.setState('idle');
        return;
      }

      if (this.obstacles?.is('snowman', body)) {
        this.lastSnowman = gameObject;
        console.log({
          snowmanBody: body,
          sprite_y: this.sprite.y,
          body_y: body.position.y,
        })
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

  subscribeClickEvents() {
    controlsService.events.on('left-control-clicked', () => {
      console.log('left-control-clicked')
      this.stateMachine?.setState('walk-touch-left');
    });

    controlsService.events.on('right-control-clicked', () => {
      console.log('right-control-clicked')
      this.stateMachine?.setState('walk-touch-right');
    });

    controlsService.events.on('jump-control-clicked', () => {
      console.log('jump-control-clicked')
      this.stateMachine?.setState('jump');
    });

    controlsService.events.on('stop-control-clicked', () => {
      console.log('stop-control-clicked')
      this.stateMachine?.setState('idle');
    });
  }

  update(dt: number) {
    this.stateMachine?.update(dt);
  }

  private _spikeHitOnEnter() {
    this.sprite.setVelocityY(-12);
    this._hitHandler(this.spikeHitTintColor, this.spikeHitHealthPoints);
  }

  private _waterHitOnEnter() {
    // this.sprite.setVelocityY(-3);
    this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.inWater) {
          this.stateMachine?.setState('water-hit');
        }
      },
    });
    this._hitHandler(this.waterHitTintColor, this.waterHitHealthPoints);
  }

  private _waterHitOnExit() {
    console.log('water hit exit');
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

    this._hitHandler(this.snowmanHitTintColor, this.snowmanHitHealthPoints);
  }

  private _hitHandler(
    color: string,
    helathPoints: number,
  ) {
    this._setTint(color);
    this.stateMachine?.setState('idle');
    this._setHealthPoints(this.healthPoints - helathPoints);
  }

  private _setTint(
    color: string,
    repeat: number = 2,
  ) {

    const startColor = Phaser.Display.Color.ValueToColor(0xffffff);
    const endColor = Phaser.Display.Color.ValueToColor(color);

    return this.scene.tweens.addCounter({
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

        this.sprite.setTint(color);
      },
    })
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
    if (this.cursors.left?.isDown) {
      this._walkLeft();
    } else if (this.cursors.right?.isDown) {
      this._walkRight();
    } else {
      this.sprite.setVelocityX(0);
      this.stateMachine?.setState('idle');
    }

    const didPressJump = Phaser.Input.Keyboard.JustDown(this.cursors.space);

    if (didPressJump) {
      this.stateMachine?.setState('jump');
    }
  }

  private _walkTouchLeftOnUpdate() {
    this._walkLeft();
  }

  private _walkTouchRightOnUpdate() {
    this._walkRight();
  }

  private _walkLeft() {
    this.sprite.flipX = true;
    this.sprite.setVelocityX(-this.walkSpeed);
  }

  private _walkRight() {
    this.sprite.flipX = false;
    this.sprite.setVelocityX(this.walkSpeed);
  }

  private _jumpOnEnter() {
    this.sprite.setVelocityY(-15);
    this.sprite.play('penguin-jump');
  }

  private _jumpOnUpdate() {
    console.log({
      left: this.cursors.left?.isDown,
      right: this.cursors.right?.isDown,
      leftKeyPressed: controlsService.leftKeyPressed,
      rightKeyPressed: controlsService.rightKeyPressed,
    })
    if (this.cursors.left?.isDown || controlsService.leftKeyPressed) {
      this.sprite.setVelocityX(-this.jumpSpeed);
    } else if (this.cursors.right?.isDown || controlsService.rightKeyPressed) {
      this.sprite.setVelocityX(this.jumpSpeed);
    } else {
      this.sprite.setVelocityX(0);
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