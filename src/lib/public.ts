import { customAlphabet } from 'nanoid';
import { z } from 'zod';

export const publicIdSchema = z.string().regex(/^[A-Za-z0-9]{12}$/, 'must be a 12-character alphanumeric id');
export const makePublicId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 12);
