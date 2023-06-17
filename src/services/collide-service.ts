import ObstaclesController from "../objects/obstacles-controller";

export interface ICollideService {
  onHit: (key: string, callback: (data: MatterJS.ICollisionPair) => void) => void;
  onCollect: (key: string, callback: (data: MatterJS.ICollisionPair) => void) => void;
  onCollide: (callback: (data: MatterJS.ICollisionPair) => void) => void;
}

export class CollideService implements ICollideService {

  private callbacksHitQueue: Map<string, (data: MatterJS.ICollisionPair) => void> = new Map();
  private callbacksCollectQueue: Map<string, (data: MatterJS.ICollisionPair) => void> = new Map();
  private callbacksCollideQueue: Map<string, (data: MatterJS.ICollisionPair) => void> = new Map();

  constructor(
    sprite: Phaser.Physics.Matter.Sprite,
    private obstacles: ObstaclesController,
  ) {
    sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
      const body = data.bodyB as MatterJS.BodyType;
      const gameObject = body.gameObject;
      const gameObject1 = gameObject as Phaser.Physics.Matter.Sprite;
      const type = gameObject1?.['getData']?.('type');

      for (const [_, callback] of this.callbacksCollideQueue) {
        callback(data);
      }

      for (const [key, callback] of this.callbacksHitQueue) {
        if (this.obstacles?.is(key, body)) {
          callback(data);
        }
      }

      for (const [key, callback] of this.callbacksCollectQueue) {
        if (type === key) {
          callback(data);
        }
      }
    });
  }

  onHit(
    key: string,
    callback: (data: MatterJS.ICollisionPair) => void,
  ) {
    this.callbacksHitQueue.set(key, callback);
  }

  onCollect(
    key: string,
    callback: (data: MatterJS.ICollisionPair) => void,
  ) {
    this.callbacksCollectQueue.set(key, callback);
  }

  onCollide(
    callback: (data: MatterJS.ICollisionPair) => void,
  ) {
    this.callbacksCollideQueue.set(`${Math.random()}_${Date.now()}`, callback);
  }
}


export const collideObstaclesServiceFactory = (
  sprite: Phaser.Physics.Matter.Sprite,
  obstacles: ObstaclesController,
) => new CollideService(sprite, obstacles);
