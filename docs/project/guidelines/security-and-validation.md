# Guidelines: Security, Validation and Best Practices

## 1. Security
- **Env vars**: Use `EXPO_PUBLIC_*` only when necessary. Never commit `.env`
- **Firebase**: Configure strict Firestore rules per user/group (pending)
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

## 4. Firestore Security (Guide)
- users/{uid}: only owner
- wallets/{id}: owner or members as per model
- transactions/{id}: validated by membership
- groups/{id}: only members
- friends/*: controlled by requests

*(Define real rules before deployment)*

## 5. Security Checklist
- [ ] No sensitive data in logs
- [ ] Client + business validation
- [ ] Auth/permission checks
- [ ] Firestore rules considered
- [ ] No excessive console.logs in production
- [ ] Errors handled without exposing full stack to user
