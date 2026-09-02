# Feature: Rewards

## Problem Statement

Points motivate kids when they connect to real household rewards. Parents define redeemable rewards with point costs; redemption deducts points on honor system without approval workflow.

## Proposed Change

Setup → Rewards: CRUD for `{ id, title, cost (integer 1–9999), active }`. Redemption: from Setup or a `Rewards` panel on Today (read-only list for kids, redeem action in Setup only to avoid accidental taps — redeem UI lives in Setup). Redeem flow: select member, select active reward, confirm dialog text exactly `Redeem "{title}" for {memberName}? Costs {cost} pts.`; on confirm create `{ id, rewardId, memberId, date, pointsSpent: cost }` and deduct from member all-time and week points. Block redemption if member `allTimePoints < cost` with message exactly `Not enough points`.

**Assumption (OD-1):** v1 includes redeemable rewards list (PRD option B), not points-only.

## Acceptance Criteria

### AC1: Create reward
**Given** Setup → Rewards is open  
**When** user saves `{ title: "Movie night", cost: 50 }`  
**Then** reward exists with `title === "Movie night"`, `cost === 50`, `active === true`, non-empty `id`

### AC2: Reject zero cost
**Given** Add reward form  
**When** user saves cost `0`  
**Then** no reward created and message exactly `Cost must be at least 1 point`

### AC3: Deactivate reward
**Given** active reward `r1`  
**When** user toggles inactive  
**Then** `r1.active === false` and `r1` is absent from Today rewards display list

### AC4: Redeem success
**Given** member `m1` with `allTimePoints === 60`, active reward `r1` cost 50  
**When** user confirms redeem for `m1` and `r1`  
**Then** redemption record with `pointsSpent === 50`, `m1` all-time points become `10`, week points reduced by 50

### AC5: Block insufficient points
**Given** `m1` all-time points 40, reward cost 50  
**When** user attempts redeem  
**Then** no redemption created and message exactly `Not enough points`

### AC6: Confirm dialog exact copy
**Given** redeem `r1` title `Movie night`, cost 50, member name `Emma`  
**When** confirm dialog opens  
**Then** body text is exactly `Redeem "Movie night" for Emma? Costs 50 pts.`

### AC7: Today shows active rewards read-only
**Given** active rewards `Movie night` (50) and inactive `Ice cream` (20)  
**When** Today rewards panel renders  
**Then** list shows exactly one row: `Movie night — 50 pts` and does not show `Ice cream`

## Files to Modify

| File | Change |
|---|---|
| `src/domain/rewards.ts` | Reward CRUD, redeem validation |
| `src/domain/redemptions.ts` | Create redemption, point deduction |
| `src/store/store.ts` | Persist `rewards[]`, `redemptions[]` |
| `src/ui/setup/RewardsPanel.tsx` | CRUD and redeem flow |
| `src/ui/today/RewardsPanel.tsx` | Read-only reward list |

## Risk

- What could break: concurrent redeem drops points below zero; validate atomically.
- Rollback: hide rewards UI; points accrue without spending.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| `createReward` | happy path | title, cost 50 | create | active reward stored |
| `validateRewardCost` | zero | cost 0 | validate | error `Cost must be at least 1 point` |
| `redeemReward` | success | m1 60 pts, cost 50 | redeem | points 10, redemption pointsSpent 50 |
| `redeemReward` | insufficient | m1 40 pts, cost 50 | redeem | error `Not enough points`, no record |
| `getActiveRewards` | filter | one active one inactive | call | length 1 |
| Confirm dialog | copy | Movie night, Emma, 50 | open | exact string per AC6 |
| Today panel | read-only | active + inactive | render | only active row shown |

## Spec Readiness checklist (run before calling the spec done)

- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
