import StateMachine from "../state-machine/state-machine";
import {sharedInstance as events} from "./../services/event-center";
import ObstaclesController from "./obstacles-controller";
import {controlsService} from "../services/controls-service";
import {usePenguinAnimation} from "./animations/penguin-animation";
import {TweensHelper} from "../helpers/tweens-helper";
import {CollideService} from "../services/collide-service";
import {Di} from "../services/di";
import {COLLIDE_OBSTACLES_SERVICE} from "../services/di-tokens";

export class PlayerController {

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private sprite: Phaser.Physics.Matter.Sprite;
  private stateMachine: StateMachine | undefined;
  private obstacles: ObstaclesController;
  private readonly scene: Phaser.Scene;
  private lastSnowman: Phaser.Physics.Matter.Sprite | undefined;
  private inWater: boolean;
  private platforms: MatterJS.BodyType[];
  private healthPoints: number = 100;
  private baseHitTintColor: string = '#ff0000';
  private spikeHitHealthPoints: number = 10;
  private spikeHitTintColor: string = this.baseHitTintColor;
  private waterHitHealthPoints: number = 5;
  private waterHitTintColor: string = '#0000ff';
  private snowmanHitHealthPoints: number = 10;
  private snowmanHitTintColor: string = this.baseHitTintColor;
  private readonly walkSpeed: number = 4;
  private jumpSpeed: number = 4;
  private hitVelocity: number = 12;
  private jumpVelocity: number = 15;
  private collideService: CollideService;

  constructor(
    sprite: Phaser.Physics.Matter.Sprite,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    obstacles: ObstaclesController,
    platforms: MatterJS.BodyType[],
    scene: Phaser.Scene,
  ) {
    this.sprite = sprite;
    this.cursors = cursors;
    this.obstacles = obstacles;
    this.scene = scene;
    this.healthPoints = 100;
    this.inWater = false;
    this.platforms = platforms;
    this.walkSpeed = controlsService.isTouchDevice ? 8 : 4;
    this.collideService = Di.container.get<CollideService>(COLLIDE_OBSTACLES_SERVICE)(this.sprite, this.obstacles);

    this.setUpStateMachine();
    this.subscribeClickEvents();
    this.setCollideHandlers();
    usePenguinAnimation(this.sprite);
  }

  setUpStateMachine() {
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
  }

  setCollideHandlers() {
    this.collideService.onCollideObstacle('water', (data: MatterJS.ICollisionPair) => {
      this.inWater = (data.bodyB as Phaser.Physics.Matter.Sprite).y < this.sprite.y;
    }, 'end');

    this.collideService.onCollideObstacle('spikes', () => {
      this.stateMachine?.setState('spike-hit');
      events.emit('spike-hit');
    });

    this.collideService.onCollideObstacle('water', () => {
      this.inWater = true;
      this.stateMachine?.setState('water-hit');
      events.emit('water-hit');
    });

    this.collideService.onCollideObstacle('snowman', (data: MatterJS.ICollisionPair) => {
      const body = data.bodyB as MatterJS.BodyType;
      this.lastSnowman = body.gameObject;
      if (this.sprite.y < body.position.y) {
        this.stateMachine?.setState('snowman-stomp');
      } else {
        this.stateMachine?.setState('snowman-hit');
      }
    });

    this.collideService.onCollideObjectType('star', (data: MatterJS.ICollisionPair) => {
      const body = data.bodyB as MatterJS.BodyType;
      const gameObject = body.gameObject;
      if (!gameObject) return;
      const sprite = gameObject as Phaser.Physics.Matter.Sprite;
      events.emit('star-collected');
      sprite.destroy();
    });

    this.collideService.onCollideObjectType('health', (data: MatterJS.ICollisionPair) => {
      const body = data.bodyB as MatterJS.BodyType;
      const gameObject = body.gameObject;
      if (!gameObject) return;
      const sprite = gameObject as Phaser.Physics.Matter.Sprite;
      const value = sprite.getData('healthPoints') ?? 10;
      this.healthPoints = Phaser.Math.Clamp(this.healthPoints + value, 0, 100);
      events.emit('health-collected', this.healthPoints);
      sprite.destroy();
    });

    this.collideService.onCollideObjectType('level-entrance', () => {
      this.scene.scene.start('level2');
    });

    this.collideService.onCollideObjectType('level-exit', () => {
      this.scene.scene.start('welcome');
    });

    this.collideService.onCollide((data: MatterJS.ICollisionPair) => {
      const body = data.bodyB as MatterJS.BodyType;
      const gameObject = body.gameObject;

      if (this.platforms?.includes(body)) {
        this.stateMachine?.setState('idle');
        return;
      }

      if (!gameObject) return;

      if (gameObject instanceof Phaser.Physics.Matter.TileBody) {
        if (this.stateMachine?.isCurrentState('jump')) {
          this.stateMachine?.setState('idle');
        }
        return
      }
    })
  }

  subscribeClickEvents() {
    controlsService.events.on('left-control-clicked', () => {
      this.stateMachine?.setState('walk-touch-left');
    });

    controlsService.events.on('right-control-clicked', () => {
      this.stateMachine?.setState('walk-touch-right');
    });

    controlsService.events.on('jump-control-clicked', () => {
      this.stateMachine?.setState('jump');
    });

    controlsService.events.on('stop-control-clicked', () => {
      this.stateMachine?.setState('idle');
    });
  }

  update(dt: number) {
    this.stateMachine?.update(dt);
  }

  private _spikeHitOnEnter() {
    this.sprite.setVelocityY(-this.hitVelocity);
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

  private _snowmanHitOnEnter() {
    if (this.lastSnowman) {
      if (this.sprite.x < this.lastSnowman.x) {
        this.sprite.setVelocityX(-this.hitVelocity);
      } else {
        this.sprite.setVelocityX(this.hitVelocity);
      }
    } else {
      this.sprite.setVelocityY(-this.hitVelocity);
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

  private _setTint = (
    color: string,
    repeat: number = 2,
  ) => TweensHelper.setTint(this.scene, this.sprite, color, repeat);

  private _snowmanStompOnEnter() {
    this.sprite.setVelocityY(-this.hitVelocity);

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
    this.sprite.setVelocityY(-this.jumpVelocity);
    this.sprite.play('penguin-jump');
  }

  private _jumpOnUpdate() {
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
}