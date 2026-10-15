'use server';

import { createActionClient } from '@/lib/supabase/actions';
import { SignInSchema, SignUpSchema } from '@/lib/validations/auth';
import { redirect } from 'next/navigation';

export interface AuthState {
  error?: string;
  success?: boolean;
}

export async function signInAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = SignInSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Invalid login details' };
  }

  const supabase = createActionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/feed');
}

export async function signUpAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    username: formData.get('username') as string,
    displayName: formData.get('displayName') as string,
  };

  const parsed = SignUpSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Invalid signup details' };
  }

  const supabase = createActionClient();

  // Check if username is already claimed
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', parsed.data.username)
    .single();

  if (existingUser) {
    return { error: 'Username is already taken. Please choose another.' };
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        username: parsed.data.username,
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/feed');
}

export async function demoSignInAction(): Promise<AuthState> {
  const supabase = createActionClient();
  
  // Authenticate as the pre-seeded demo account
  const { error } = await supabase.auth.signInWithPassword({
    email: 'demo@socialsentinel.io',
    password: 'Demo1234!',
  });

  if (error) {
    return { error: 'Demo account not initialized. Please run database seeding first.' };
  }

  redirect('/feed');
}

export async function signOutAction() {
  const supabase = createActionClient();
  await supabase.auth.signOut();
  redirect('/login');
}
