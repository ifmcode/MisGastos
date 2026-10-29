# Guidelines: Security, Validation and Best Practices

## 1. Security
- **Env vars**: Use `EXPO_PUBLIC_*` only when necessary. Never commit `.env`
- **Firebase**: Strict Firestore rules per user/group in `firestore.rules` (deploy pending)
- **Auth**: Verify authenticated user before sensitive operations
- **Data**: Don't log sensitive info (tokens, passwords)
- **Errors**: Show user-friendly messages, log details in dev
- **Permissions**: Verify ownership/membership before CRUD

## 2. Validation
- **Client**: Validate forms (required, format, amount > 0)
- **Business**: Validate in services (sufficient balance, permissions)
- **Types**: Leverage TypeScript
- **Amounts**: Be careful with decimals. Consider working in cents (integers) or strict validation
- **Dates**: Valid, not in future if inappropriate

### Amount Rules
- > 0 for expenses/incomes as appropriate
- Transfers between own wallets allowed with validations
- Don't allow unexpected negative amounts

## 3. Input Validation Pattern
```typescript
function validateAmount(amount: number): {ok: boolean, error?: string} {
  if (isNaN(amount)) return {ok:false, error:'Invalid amount'}
  if (amount <= 0) return {ok:false, error:'Must be greater than 0'}
  return {ok:true}
}
```

## 4. Firestore Security (Implemented)
- Rules live in `firestore.rules` at the repository root.
- `users/{uid}` documents are only readable/writable by their owner (the current auth flow stores the uid in a field).
- The root `wallets/{walletId}` collection is owner-only; reads/deletes require `resource.data.ownerId == uid`, creates require `request.resource.data.ownerId == uid`, and updates cannot change `ownerId`.
- Deploy with `npx firebase-tools login` and then `npx firebase-tools deploy --only firestore:rules`.
- Keep `firestore.indexes.json` updated when new composite indexes are needed.

## 5. Security Checklist
- [ ] No sensitive data in logs
- [ ] Client + business validation
- [ ] Auth/permission checks
- [x] Firestore rules considered (`firestore.rules`)
- [ ] No excessive console.logs in production
- [ ] Errors handled without exposing full stack to user
