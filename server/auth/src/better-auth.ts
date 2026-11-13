/**
 * Better Auth remains private to this module. The development scaffold exposes
 * the same service boundary while production credentials and persistence are
 * introduced in a later milestone.
 */
export const authConfiguration = {
  applicationName: "Porphyra",
  developmentUser: "dev@a244.tech",
  developmentSubject: "development-user",
  jwtAudience: "porphyra-api",
  jwtSecret: Bun.env.PORPHYRA_AUTH_JWT_SECRET || "porphyra-development-jwt-secret-2026"
} as const
