/** Port: injectable randomness for testability */
export interface RandomSource {
  random(): number;
}

/** Default production random source */
export const defaultRandom: RandomSource = { random: () => Math.random() };
