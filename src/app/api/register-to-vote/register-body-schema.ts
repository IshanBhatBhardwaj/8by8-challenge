import { z } from 'zod';

//Potential Fix: Validate better. For example, in us_state, is there a way to make sure the input is an actual state? Is this needed?
export const registerBodySchema = z.object({
  state: z.string({required_error: "us_state not valid"}).min(2, "must be at least 2 char"),
  city: z.string({required_error: "city not valid"}).min(1, "must be at least 1 char"),
  street: z.string({required_error: "street not valid"}).min(1, "must be at least 1 char"),
  name_first: z.string({required_error: "name_first not valid"}).min(1, "must be at least 1 char"),
  name_last: z.string({required_error: "name_last not valid"}).min(1, "must be at least 1 char"),
  dob: z.string({required_error: "dob not valid"}).min(1, "must be at least 1 char"),
  zip: z.string({required_error: "zip not valid"}).min(1, "must be at least 1 char"),
  email: z.string({required_error: "email not valid"}).min(1, "must be at least 1 char"),
  citizen: z.string({required_error: "citizen not valid"}).min(1, "must be at least 1 char"),
  eighteenPlus: z.string({required_error: "eighteen_plus not valid"}).min(1, "must be at least 1 char"),
  party: z.string({required_error: "party not valid"}).min(1, "must be at least 1 char"),
  idNumber: z.string({required_error: "id_number not valid"}).min(1, "must be at least 1 char"),
});

export const supabaseRegisterBodySchema = z.object({
  user_id: z.string({required_error: "user_id not valid"}).min(1, "must be at least 1 char"),
  us_state: z.string({required_error: "us_state not valid"}).min(2, "must be at least 2 char"),
  city: z.string({required_error: "city not valid"}).min(1, "must be at least 1 char"),
  street: z.string({required_error: "street not valid"}).min(1, "must be at least 1 char"),
  name_first: z.string({required_error: "name_first not valid"}).min(1, "must be at least 1 char"),
  name_last: z.string({required_error: "name_last not valid"}).min(1, "must be at least 1 char"),
  dob: z.string({required_error: "dob not valid"}).min(1, "must be at least 1 char"),
  zip: z.string({required_error: "zip not valid"}).min(1, "must be at least 1 char"),
  email: z.string({required_error: "email not valid"}).min(1, "must be at least 1 char"),
  citizen: z.string({required_error: "citizen not valid"}).min(1, "must be at least 1 char"),
  eighteen_plus: z.string({required_error: "eighteen_plus not valid"}).min(1, "must be at least 1 char"),
  party: z.string({required_error: "party not valid"}).min(1, "must be at least 1 char"),
  id_number: z.string({required_error: "id_number not valid"}).min(1, "must be at least 1 char"),
});


