import { z } from "zod";

const MAX_BCRYPT_BYTES = 72;

function fitsBcryptLimit(value: string) {
  return Buffer.byteLength(value, "utf8") <= MAX_BCRYPT_BYTES;
}

export const loginCredentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.").max(254)),
  password: z
    .string()
    .min(1, "Enter your password.")
    .refine(fitsBcryptLimit, "Password is too long."),
});

export const strongPasswordSchema = z
  .string()
  .min(12)
  .refine(fitsBcryptLimit, "Password must be at most 72 UTF-8 bytes.")
  .regex(/[A-Za-z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain a symbol.");

export const adminProvisionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: strongPasswordSchema,
});

export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;
export type AdminProvisionInput = z.infer<typeof adminProvisionSchema>;
