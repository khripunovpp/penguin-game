import ObstaclesController from "../objects/obstacles-controller";

export class CollideService {

  constructor(
    private sprite: Phaser.Physics.Matter.Sprite,
    private obstacles: ObstaclesController,
  ) {
    this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
      const body = data.bodyB as MatterJS.BodyType;
      const gameObject = body.gameObject;
      const sprite = gameObject as Phaser.Physics.Matter.Sprite;
      const type = sprite.getData('type');
      if (type === 'ground') {
        this.callbacksQueue.forEach((callback) => {
          callback();
        });
      }
    });
  }

  callbacksQueue: Array<() => void> = [];

  onHit(
    key: string,
    callback: (data: MatterJS.ICollisionPair) => void,
  ) {
    this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
      const body = data.bodyB as MatterJS.BodyType;
      if (this.obstacles?.is(key, body)) {
        callback(data);
      }
    })
  }

  onCollect(
    key: string,
    callback: (data: MatterJS.ICollisionPair) => void,
  ) {
    this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
      const body = data.bodyB as MatterJS.BodyType;
      const gameObject = body.gameObject;
      const sprite = gameObject as Phaser.Physics.Matter.Sprite;
      const type = sprite.getData('type');
      if (type === key) {
        callback(data);
      }
    })
  }
}


export const collideObstaclesService = (
  sprite: Phaser.Physics.Matter.Sprite,
  obstacles: ObstaclesController,
) => new CollideService(sprite, obstacles);
