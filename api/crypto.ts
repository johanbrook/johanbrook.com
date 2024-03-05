import nodeCrypto from 'node:crypto';
import { timingSafeEqual } from 'https://deno.land/std@0.218.2/crypto/timing_safe_equal.ts';

export const generateAccessToken = () => {
    return nodeCrypto.randomBytes(32).toString('hex');
};

export const safeEqualStrings = (a: string, b: string) => {
    if (a.length != b.length) return false;
    const encoder = new TextEncoder();
    return timingSafeEqual(encoder.encode(a), encoder.encode(a));
};
