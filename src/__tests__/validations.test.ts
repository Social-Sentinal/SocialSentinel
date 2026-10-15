import { describe, it, expect } from 'vitest';
import { SignUpSchema, SignInSchema, ProfileUpdateSchema } from '@/lib/validations/auth';
import { PostCreateSchema, CommentCreateSchema, ReportCreateSchema } from '@/lib/validations/post';

describe('Zod Input Validation Schemas', () => {
  it('validates correct sign-up payload and rejects invalid inputs', () => {
    const valid = SignUpSchema.safeParse({
      email: 'user@example.com',
      password: 'StrongPassword123!',
      username: 'elena_ai',
      displayName: 'Elena Vasquez',
    });
    expect(valid.success).toBe(true);

    const invalidUsername = SignUpSchema.safeParse({
      email: 'user@example.com',
      password: 'Password123',
      username: 'bad username with spaces',
      displayName: 'Elena',
    });
    expect(invalidUsername.success).toBe(false);

    const shortPassword = SignUpSchema.safeParse({
      email: 'user@example.com',
      password: '123',
      username: 'valid_user',
      displayName: 'Valid Name',
    });
    expect(shortPassword.success).toBe(false);
  });

  it('validates post creation schema and rejects empty or oversized captions', () => {
    const validPost = PostCreateSchema.safeParse({
      caption: 'A wonderful technical post on social intelligence',
      topicCategory: 'AI & Tech',
    });
    expect(validPost.success).toBe(true);

    const emptyPost = PostCreateSchema.safeParse({
      caption: '   ',
      topicCategory: 'AI & Tech',
    });
    expect(emptyPost.success).toBe(false);

    const oversizedPost = PostCreateSchema.safeParse({
      caption: 'a'.repeat(5001),
      topicCategory: 'AI & Tech',
    });
    expect(oversizedPost.success).toBe(false);
  });

  it('validates threaded comment schema with parentCommentId', () => {
    const validComment = CommentCreateSchema.safeParse({
      postId: '10000000-0000-0000-0000-000000000001',
      parentCommentId: '20000000-0000-0000-0000-000000000002',
      body: 'This is a thoughtful reply.',
    });
    expect(validComment.success).toBe(true);
  });

  it('validates report creation schema', () => {
    const validReport = ReportCreateSchema.safeParse({
      targetType: 'post',
      targetId: '10000000-0000-0000-0000-000000000001',
      reason: 'Harassment or personal abuse',
      details: 'Offensive language used in thread',
    });
    expect(validReport.success).toBe(true);
  });
});
