/**
 * Better Auth remains private to this module. The development scaffold exposes
 * the same service boundary while production credentials and persistence are
 * introduced in a later milestone.
 */
export const authConfiguration = {
  applicationName: "Porphyra",
  developmentUser: "dev@a244.tech"
} as const
