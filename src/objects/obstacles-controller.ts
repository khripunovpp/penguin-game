export type Obstacle = MatterJS.BodyType;

const createKey = (
  name: string,
  obstacle: Obstacle,
) => `${name}-${obstacle.id}`;

export default class ObstaclesController {
  private _obstacles = new Map<string, Obstacle>();

  add(
    name: string,
    obstacle: Obstacle,
  ) {
    const key = createKey(name, obstacle);
    if (this._obstacles.has(key)) {
      throw new Error(`Obstacle with key ${key} already exists`);
    }
    this._obstacles.set(key, obstacle);
  }

  is(
    name: string,
    obstacle: Obstacle,
  ) {
    const key = createKey(name, obstacle);

    if (!this._obstacles.has(key)) {
      return false;
    }

    return true;
  }


}