# Feature: Gamification

## Problem Statement

The product must reward active contributors and make effort visible on the shared board without shaming low activity (PRD FR-G5). Points from completions drive recognition; the most active member(s) each week receive visual highlight.

## Proposed Change

Compute per member: `weekPoints` = sum of completion `points` for ISO week (Monday 00:00 local through Sunday 23:59:59 local) minus sum of redemption `pointsSpent` in same week; `allTimePoints` = same over all time. Activity strip on Today shows `weekCompletionCount` (count of completions in current week, not points). Highlight: member(s) with strictly highest `weekCompletionCount` receive CSS class `most-active` (e.g. gold border `#EAB308` 2px on tab and strip chip). Ties: all tied members get highlight. Members with `weekCompletionCount === 0` never receive `most-active`. No ranking list ordered 1st–6th; only highlight top tier.

**Assumption (OD-9):** Today activity strip uses completion counts; member tabs also show `allTimePoints` as badge text exactly `{n} pts` (integer, no decimals).

## Acceptance Criteria

### AC1: Week points from completions
**Given** member `m1` completes tasks worth 10 and 15 points in the current ISO week, no redemptions  
**When** `weekPoints(m1)` is computed  
**Then** result is exactly `25`

### AC2: All-time points badge on member tab
**Given** `m1` has completions totaling 100 points all-time and redemptions totaling 20 all-time  
**When** Today renders `m1` tab  
**Then** tab badge text is exactly `80 pts`

### AC3: Activity strip completion counts
**Given** `m1` has 4 completions and `m2` has 2 completions in current week  
**When** activity strip renders  
**Then** strip includes `m1` with count `4` and `m2` with count `2`

### AC4: Most active highlight single leader
**Given** `m1` week completion count 5, `m2` count 3, all others lower  
**When** Today renders  
**Then** exactly `m1` tab and `m1` strip chip have class `most-active`

### AC5: Most active highlight tie
**Given** `m1` and `m2` both week completion count 4, higher than others  
**When** Today renders  
**Then** both `m1` and `m2` have class `most-active` and no other member does

### AC6: Zero completions not highlighted
**Given** all members have `weekCompletionCount === 0`  
**When** Today renders  
**Then** zero elements have class `most-active`

### AC7: No shame ranking
**Given** any household state  
**When** Today or Week renders  
**Then** no element displays ordinal rank text matching regex `/(1st|2nd|3rd|[4-6]th|last place|least active)/i`

## Files to Modify

| File | Change |
|---|---|
| `src/domain/points.ts` | `weekPoints`, `allTimePoints`, `weekCompletionCount`, `getMostActiveMemberIds` |
| `src/ui/today/ActivityStrip.tsx` | Completion counts, highlight styling |
| `src/ui/today/MemberTab.tsx` | All-time points badge, highlight |
| `src/ui/styles/most-active.css` | `#EAB308` 2px border rules |

## Risk

- What could break: week boundary timezone shifts counts at midnight Monday.
- Rollback: hide badges and highlights; show raw completion checkmarks only.

## Testing Strategy (MANDATORY)

| Function | Case | Given | When | Then |
|---|---|---|---|---|
| `weekPoints` | sum | completions 10+15 this week | compute m1 | 25 |
| `allTimePoints` | minus redemptions | 100 earned, 20 spent | compute | 80 |
| `weekCompletionCount` | count | 4 completions m1 this week | compute | 4 |
| `getMostActiveMemberIds` | single max | m1:5, m2:3 | call | `["m1"]` |
| `getMostActiveMemberIds` | tie | m1:4, m2:4, m3:1 | call | `["m1","m2"]` |
| `getMostActiveMemberIds` | all zero | all 0 | call | `[]` |
| UI | badge text | allTime 80 | render tab | `80 pts` |
| UI | no rank text | any state | render Today | no 1st/2nd/last place strings |

## Spec Readiness checklist (run before calling the spec done)

- [x] Every AC has a precise expected value — no "works correctly"
- [x] Another person could write a test from each AC without asking
- [x] Every AC can fail — one that cannot fail proves nothing
- [x] Error and edge cases have ACs of their own
- [x] Every AC appears in the testing strategy table
