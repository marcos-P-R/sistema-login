---
description: "Use when writing or reviewing tests. All test descriptions, describe blocks, it/test blocks, and any detail messages must be written in English."
applyTo: "tests/**"
---

# Test Language Standard

All test code must use English for:

- `describe()` block names
- `it()` / `test()` block names
- Assertion messages and failure details
- Comments inside test files
- Step definitions (BDD)
- Feature file scenario names and steps
- Variable names and inline documentation within tests

## Examples

**Correct:**
```ts
describe("UserService", () => {
  it("should return an error when the user is not found", async () => {
    // Arrange
    const userId = "non-existent-id";
    // Act & Assert
    await expect(service.findById(userId)).rejects.toThrow("User not found");
  });
});
```

**Incorrect:**
```ts
describe("UserService", () => {
  it("deve retornar erro quando o usuário não for encontrado", async () => {
    // Arrange
    const userId = "id-inexistente";
  });
});
```
