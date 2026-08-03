import type { PetSpecies } from '@/lib/pet-engine';
import type { SpeciesDef } from '../types';
import { cat } from './cat';
import { dog } from './dog';
import { bunny } from './bunny';
import { dragon } from './dragon';
import { unicorn } from './unicorn';
import { fox } from './fox';

export const SPECIES: Record<PetSpecies, SpeciesDef> = {
  cat, dog, bunny, dragon, unicorn, fox,
};
