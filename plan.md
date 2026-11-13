# Authorization and Church Policy Plan

This document records the intended authorization direction. It is deliberately
not an implementation commitment for the current database foundation.

## Principles

- A `User` is the global identity record, linked to the authentication
  provider's stable subject identifier.
- A `ChurchMembership` represents that person's church-specific identity and
  data. Team and ministry participation attach to this record, not directly to
  `User`.
- Roles are church-defined policy labels. Porphyra may offer editable defaults,
  but no application behavior relies on a role name.
- Permissions are code-owned, stable business capabilities. Application code
  authorizes capabilities, never role names.
- Access is default-deny. Omitted permissions are not granted. When a person
  has multiple roles, grants are combined. Explicit deny rules are out of scope
  until a concrete need establishes conflict-resolution rules.

## Future Policy Model

```text
ChurchMembership
  └── RoleAssignment
        └── ChurchRole
              └── permissions JSON
                    └── Porphyra capability registry
```

`ChurchRole` is owned by a church and has a stable local identifier, editable
name, description, and JSON policy document. A church can define roles such as
`it_super_hero` or `never_let_near_tech` without code changes.

The JSON is stored in a portable JSON column and validated at write time against
the application capability registry. It may be displayed as a nested policy
document for administrators, for example:

```json
{
  "scheduling": ["view", "edit"],
  "configuration": ["view", "manage"],
  "member_notes": []
}
```

The application normalizes this document to stable capability keys such as
`scheduling.view` and `configuration.manage` before authorization checks.

## Future Delivery Steps

1. Define the application-owned capability registry alongside the first
   protected operations.
2. Add `ChurchRole`, `RoleAssignment`, and JSON policy validation.
3. Seed editable default roles when a church is created.
4. Add scoped role assignments only when a concrete ministry- or team-scoped
   policy requires them; do not introduce polymorphic scope records early.
5. Add authorization audit history before exposing role-policy editing in the
   production application.
