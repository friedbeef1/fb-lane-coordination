# FB-Lane First-Run Guide

This guide explains what happens during an FB-Lane run, what
the main terms mean, and how to tell whether the result is implemented,
proposed, or blocked.

## The Problem FB-Lane Addresses

Most product ideas begin with a desired outcome, not a complete plan. A person building a product may understand the problem they want to solve
without yet knowing the smallest useful scope, the technical risks, the
intended user experience, or the business decisions required.

When AI agents begin implementing before those concerns are aligned, they
may produce work quickly but build the wrong thing, make conflicting
assumptions, or require repeated prompting and rework.

## What FB-Lane Does

FB-Lane helps take a product idea from an unclear request to an approved,
coordinated, and verified implementation. It first clarifies what should
be built, then has specialist Product, Tech, Design, and Business lanes
plan their respective parts.

A Build Flow Manager (BFM) reconciles those plans, implements the approved
and unblocked work, and checks the result against the goal, evidence,
board, and repository state before calling it done. 

At the end, it reports what was built, what remains proposed, what is blocked, and what should happen next.

FB-Lane cannot eliminate every mistake or unknown. Its purpose is to make
important decisions, assumptions, dependencies, and blockers visible
earlier, helping reduce avoidable rework, coordination overhead, and
repeated prompting.

## Before You Start

A full FB-Lane coordination run expects the target project to have:

- a Git repository;
- the FB-Lane project files created by bootstrap;
- `PROJECT_BOARD.md`;
- `docs/handoffs/index.md`;
- the local `tools/fb-lane.cjs` coordination utility; and
- an approved Product goal before non-trivial source execution.

Run the read-only health check from the project root:

```bash
node tools/fb-lane.cjs doctor
```

If Git or the local coordination utility is missing, fix or complete the
project bootstrap before relying on file claims, branches, worktrees,
submissions, or merges. FB-Lane may still prepare plans or documentation,
but that is not the complete coordination workflow.

## What Happens During A Run

1. **Product clarifies the request.**  
   The broad idea becomes an objective, success criteria, scope,
   Definition of Done, and approval points.

2. **The user approves or changes the goal.**  
   FB-Lane should not silently turn assumptions into approved Product
   decisions.

3. **Specialist lanes prepare plans.**  
   Product, Tech, Design, and Business examine the work from their
   respective perspectives. Ordinary lane threads remain plan-only.

4. **BFM reconciles the plans.**  
   BFM checks dependencies, file ownership, review requirements, risks,
   gates, and whether the work should be divided into smaller stories.

5. **BFM executes the ready work.**  
   BFM launches implementation only for approved, unblocked work within
   the agreed scope.

6. **The work returns to Product.**  
   Product/BFM compares the goal, source, documentation, tests, evidence,
   board, and Git state before closeout.

## Plain-English Glossary

| Term | Meaning |
|---|---|
| **FB-Lane** | The coordination framework described by this repository. |
| **Lane** | A specialist perspective—Product, Tech, Design, or Business—with a defined responsibility. |
| **Product** | The role responsible for the goal, scope, priorities, approvals, sequencing, and final integration decisions. |
| **BFM** | **Build Flow Manager**: the Product-led execution process that reconciles approved lane plans, sequences implementation, and verifies the result. |
| **Handoff** | A written plan or result passed from one lane to Product/BFM or another responsible owner. |
| **Gate** | A condition or decision that must be resolved before particular work can continue. |
| **Lock or file claim** | A temporary declaration that particular files belong to an active task, preventing overlapping edits. |
| **Evidence** | Tests, screenshots, browser checks, diffs, staging links, or other proof that the work satisfies the approved goal. |
| **Staging QA** | Work awaiting a defined functional, visual, or release-oriented QA pass. The closeout should state whether testing occurred locally, in a preview environment, or in staging. |
| **Closeout** | The final reconciliation of the goal, implementation, evidence, board, documentation, tests, and Git state. |

Terms such as “entitlement,” “webhook,” or “merchant of record” belong
to the product being built, not to FB-Lane itself. Project output should
explain material domain-specific language when it first appears.

## How To Read The Result

Every closeout should make four categories understandable:

| Category | Meaning |
|---|---|
| **Built** | Present in actual files or systems, with the available checks named. Built does not automatically mean production-ready. |
| **Proposed** | Recommended in a plan or handoff but not implemented or approved. |
| **Blocked** | Unable to proceed until a named decision, dependency, permission, or external action changes. |
| **Next** | The specific action and owner required to continue. |

The closeout should also identify which important choices were:

- explicitly approved by the user;
- inferred by the system;
- temporary prototype decisions; or
- still awaiting a decision.

## Why FB-Lane May Stop

FB-Lane may stop because:

- the goal or approval is unclear;
- the requested work changes the approved scope;
- another task owns the same files;
- required Git or coordination tooling is unavailable;
- a test or verification check failed;
- a physical or external action is required; or
- the next step affects credentials, payments, authentication, privacy,
  destructive data, provider state, or live deployment.

When it stops, the closeout should explain:

1. what stopped;
2. why it stopped;
3. what remains safe and usable;
4. what decision or external action is required; and
5. what happens to replaced or superseded work.

Superseded work is no longer the active Product direction. Its artifacts
may remain as historical reference unless Product explicitly decides to
remove or archive them.

## Ordinary Codex Or FB-Lane?

| Use ordinary Codex when… | Use FB-Lane when… |
|---|---|
| The change is small, isolated, or easy to verify. | The product goal or scope needs clarification. |
| One thread can safely own the work. | Product, Tech, Design, and Business concerns must be reconciled. |
| There are no overlapping files or handoffs. | Multiple workers, files, dependencies, or review gates are involved. |
| You want the shortest path to a focused implementation. | You want durable decisions, explicit ownership, and evidence returned to the approved goal. |

FB-Lane introduces more structure at the beginning. Its clarification
prompts are intended to reduce hidden assumptions, repeated prompting,
conflicting edits, and reconstruction work later.

## Worked Example: Creator-Commerce MVP

A user asks FB-Lane to build a Gumroad-like product.

Product narrows the first release to one creator selling one digital
product. It clarifies the buyer journey, fee model, supported file types,
and what is outside the first release.

Tech identifies payment, storage, identity, delivery, refund, and
security requirements. Design describes the publishing, storefront,
checkout, receipt, and sales flows. Business proposes positioning,
pricing language, and support copy.

After the goal is approved, BFM can implement a safe local prototype.
Real payments, credentials, private file storage, production identity,
and deployment remain blocked until their named decisions and checks
are complete.

A useful closeout would say:

- **Built:** Runnable local, provider-neutral creator-commerce prototype
  with simulated checkout and access.
- **Proposed:** Production payment, private storage, and identity work.
- **Blocked:** Live provider state and legal/payment decisions.
- **Next:** Product decides the seller model and authorizes the next
  implementation stage.
