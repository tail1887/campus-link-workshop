/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "@prisma/client" {
  export namespace Prisma {
    export type JsonPrimitive = string | number | boolean | null;

    export type JsonValue =
      | JsonPrimitive
      | { [key: string]: JsonValue }
      | JsonValue[];

    export type InputJsonValue = JsonValue;
  }

  export class PrismaClient {
    constructor(options?: {
      log?: string[];
    });

    user: {
      findUnique(args: unknown): Promise<any>;
      create(args: unknown): Promise<any>;
    };
    session: {
      create(args: unknown): Promise<any>;
      deleteMany(args: unknown): Promise<any>;
      findUnique(args: unknown): Promise<any>;
    };
    onboardingState: {
      findUnique(args: unknown): Promise<any>;
      upsert(args: unknown): Promise<any>;
    };
    recruitPost: {
      findMany(args: unknown): Promise<any[]>;
      findUnique(args: unknown): Promise<any>;
      create(args: unknown): Promise<any>;
    };
    recruitApplication: {
      findFirst(args: unknown): Promise<any>;
      create(args: unknown): Promise<any>;
    };
    profile: {
      findUnique(args: unknown): Promise<any>;
      upsert(args: unknown): Promise<any>;
    };
    resume: {
      findUnique(args: unknown): Promise<any>;
      upsert(args: unknown): Promise<any>;
    };
    verification: {
      findUnique(args: unknown): Promise<any>;
      upsert(args: unknown): Promise<any>;
    };
    inquiry: {
      findMany(args: unknown): Promise<any[]>;
      create(args: unknown): Promise<any>;
    };
    alertPreference: {
      findUnique(args: unknown): Promise<any>;
      upsert(args: unknown): Promise<any>;
    };
    githubConnection: {
      findUnique(args: unknown): Promise<any>;
      upsert(args: unknown): Promise<any>;
    };
    aiJob: {
      findUnique(args: unknown): Promise<any>;
      create(args: unknown): Promise<any>;
      update(args: unknown): Promise<any>;
    };
  }
}
