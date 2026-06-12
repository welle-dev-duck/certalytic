import { z } from 'zod';

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, 'Email address is required.')
        .email('Enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
});

export const registerSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, 'Name is required.')
            .max(255, 'Name must not exceed 255 characters.'),
        email: z
            .string()
            .trim()
            .min(1, 'Email address is required.')
            .email('Enter a valid email address.'),
        password: z.string().min(1, 'Password is required.'),
        password_confirmation: z
            .string()
            .min(1, 'Password confirmation is required.'),
        accept_terms: z.string().optional(),
        accept_privacy: z.string().optional(),
        accept_dpa: z.string().optional(),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'Password confirmation does not match.',
        path: ['password_confirmation'],
    })
    .refine((data) => data.accept_terms === '1', {
        message: 'You must accept the Terms of Service.',
        path: ['accept_terms'],
    })
    .refine((data) => data.accept_privacy === '1', {
        message: 'You must accept the Privacy Policy.',
        path: ['accept_privacy'],
    })
    .refine((data) => data.accept_dpa === '1', {
        message: 'You must accept the Data Processing Agreement.',
        path: ['accept_dpa'],
    });

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, 'Email address is required.')
        .email('Enter a valid email address.'),
});

export const createTeamSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Enter a team name.')
        .max(255, 'Team name must not exceed 255 characters.'),
});
