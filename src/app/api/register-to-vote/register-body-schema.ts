import { z } from 'zod';

//Potential Fix: Validate better. For example, in us_state, is there a way to make sure the input is an actual state? Is this needed?
export const registerBodySchema = z.object({
  us_state: z.string().min(1),
  city: z.string().min(1),
  street: z.string().min(1),
  name_first: z.string().min(1),
  name_last: z.string().min(1),
  dob: z.string().min(1),
  zip: z.string().min(1),
  email: z.string().min(1),
  citizen: z.string().min(1),
  eighteen_plus: z.string().min(1),
  party: z.string().min(1),
  idNumber: z.string().min(1),
});
