File: [`backend/src/utils/graphql.ts`](../../../../backend/src/utils/graphql.ts)

**What It Does**
- Maps internal AppError to Apollo GraphQL errors.
- Preserves status codes and details in extensions.

**Why This Structure**
- Ensures GraphQL clients receive normalized error shapes.
- Keeps resolver logic clean and minimal.

**Principles**
- Error normalization.
- Thin resolver design.


**Principles Explained**
- `Error normalization`: Convert diverse errors into a consistent shape for clients.
- `Thin resolver design`: Resolvers do minimal work and delegate to services.
