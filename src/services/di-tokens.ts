const createToken = (name: string) => `DI_TOKEN_${name}`;

export const createTokenFactory = (name: string) => {
  const nameToken = createToken(name);
  return Symbol(nameToken);
};

export const COLLIDE_OBSTACLES_SERVICE = createTokenFactory('COLLIDE_OBSTACLES_SERVICE');