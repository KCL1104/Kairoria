import { Idl } from '@coral-xyz/anchor';

export const KairoriaRentalIDL: Idl;

export interface KairoriaRental extends Idl {
  name: 'kairoria_rental';
  instructions: any[];
  accounts: any[];
  types: any[];
  events: any[];
  errors: any[];
  metadata: any;
}