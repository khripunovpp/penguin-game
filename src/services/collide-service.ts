import ObstaclesController from "../objects/obstacles-controller";

export interface ICollideService {
  onCollideObjectType(
    type: string,
    callback: (data: MatterJS.ICollisionPair) => void,
    position?: 'start' | 'end',
  ): void;

  onCollide(
    callback: (data: MatterJS.ICollisionPair) => void,
    position?: 'start' | 'end',
  ): void;

  onCollideObstacle(
    name: string,
    callback: (data: MatterJS.ICollisionPair) => void,
    position?: 'start' | 'end',
  ): void;
}

export class CollideService implements ICollideService {

  private callbacksCollideQueue: Map<string, (data: MatterJS.ICollisionPair) => void> = new Map();
  private callbacksCollideEndQueue: Map<string, (data: MatterJS.ICollisionPair) => void> = new Map();

  constructor(
    sprite: Phaser.Physics.Matter.Sprite,
    private obstacles: ObstaclesController,
  ) {
    sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
      for (const [_, callback] of this.callbacksCollideQueue) {
        callback(data);
      }
    });

    sprite.setOnCollideEnd((data: MatterJS.ICollisionPair) => {
      for (const [_, callback] of this.callbacksCollideEndQueue) {
        callback(data);
      }
    });
  }

  onCollide(
    callback: (data: MatterJS.ICollisionPair) => void,
    position: 'start' | 'end' = 'start',
  ) {
    const key = `${Math.random()}_${Date.now()}`;
    if (position === 'start') {
      this.callbacksCollideQueue.set(key, callback);
    } else if (position === 'end') {
      this.callbacksCollideEndQueue.set(key, callback);
    }
  }

  onCollideObjectType(
    type: string,
    callback: (data: MatterJS.ICollisionPair) => void,
    position: 'start' | 'end' = 'start',
  ) {
    const fn = (data: MatterJS.ICollisionPair) => {
      debugger;
      const body = data.bodyB as MatterJS.BodyType;
      const gameObject = body.gameObject;
      const gameObject1 = gameObject as Phaser.Physics.Matter.Sprite;
      const typeObj = gameObject1?.['getData']?.('type');
      if (type === typeObj) {
        callback(data);
      }
    };

    if (position === 'start') {
      this.callbacksCollideQueue.set(type, fn);
    } else if (position === 'end') {
      this.callbacksCollideEndQueue.set(type, fn);
    }
  }

  onCollideObstacle(
    key: string,
    callback: (data: MatterJS.ICollisionPair) => void,
    position: 'start' | 'end' = 'start',
  ) {
    const fn = (data: MatterJS.ICollisionPair) => {
      const body = data.bodyB as MatterJS.BodyType;
      if (this.obstacles?.is(key, body)) {
        callback(data);
      }
    };

    if (position === 'start') {
      this.callbacksCollideQueue.set(key, fn);
    } else if (position === 'end') {
      this.callbacksCollideEndQueue.set(key, fn);
    }
  }
}


export const collideObstaclesServiceFactory = (
  sprite: Phaser.Physics.Matter.Sprite,
  obstacles: ObstaclesController,
) => new CollideService(sprite, obstacles);
