# IMONMYWAY — 2-Minute Demo Script

## Structure: 4 acts, 30 seconds each

---

### ACT 1 — The Problem (0:00–0:30)

**Visual:** Split screen — left is a cron-job dashboard, right is an oracle diagram. Fade both to red X's.

**Narration:**
"Every autonomous contract today needs a keeper bot, a cron job, or an oracle. You bolt a centralized server onto your trustless contract and hope it stays running. That's not autonomous — that's leased."

**Visual:** Transition to IMONMYWAY architecture diagram — single box labeled "Somnia Chain" with arrows looping inside it. No external boxes.

**Narration:**
"IMONMYWAY is different. The chain is the runtime. No server, no keeper, no cron. Smart contracts that wake themselves up."

---

### ACT 2 — The Proof (0:30–1:00)

**Visual:** Open shannon-explorer.somnia.network. Scroll through 5 transactions in order.

**Narration (pace picks up):**
"Here's the proof. Five transactions on Somnia Testnet. No backend touched any of them."

**Visual clicks through each:**

1. **Deploy** — "Deploy the agent contract. Funded with STT. That's it for infrastructure."
2. **Authorize** — "Authorize the deployer. One transaction."
3. **Initiate** — "Call initiateCommitment. The contract sends a request to Somnia's on-chain LLM agent — Qwen3-30B, consensus-verified by validators."
4. **LLM callback** — "Seconds later, the LLM responds on-chain. The contract receives the callback and creates a verified commitment with pace 200 seconds per kilometer."
5. **Commitment created** — "The commitment exists on-chain. All autonomous. No human touched it after step one."

**Narration:**
"Five transactions. Zero infrastructure. The agent decided the pace, created the commitment, and prepared for settlement — all on-chain, all by itself."

---

### ACT 3 — The Reliability Architecture (1:00–1:30)

**Visual:** Three-layer pyramid diagram.

**Narration:**
"We built three layers of defense because on a prototype testnet, things fail."

**Visual highlights Layer 1 (top, green):**
"Layer one: on-chain reactivity. The Schedule subscription fires at the deadline and the contract settles itself. Zero cost, zero infrastructure. This is the mainnet design."

**Visual highlights Layer 2 (middle, gold):**
"Layer two: settleCommitment. If the subscription misses, anyone can call settleCommitment on any past-deadline commitment. Permissionless. Gas is about a tenth of a cent."

**Visual highlights Layer 3 (bottom, blue, optional):**
"Layer three: auto-retry. When the LLM agent returns failed or timed out, the contract retries up to three times automatically. Self-healing without a keeper."

**Narration:**
"This isn't a workaround — it's defense in depth. The architecture works with or without any single layer."

---

### ACT 4 — The Framework (1:30–2:00)

**Visual:** Punctuality was just Station 01. Fade to a grid of other use cases: liquidations, prediction markets, bounty escrows, subscription renewals.

**Narration:**
"Punctuality commitments are the proof of concept. But the pattern is general: any contract that needs to wake up, make a decision, and settle on a deadline."

**Visual:** Show the live site at imonmyway.netlify.app/dashboard. The "Demo" badge is visible. Click the "View 5 explorer txns" link.

**Narration:**
"The live spectator site streams on-chain activity. Right now it's showing the proven demo run because the testnet is quiet — click through to verify every transaction yourself."

**Visual:** Code snippet of `settleCommitment` — the 15-line function.

**Narration:**
"The entire reliability fallback is fifteen lines of Solidity. No chainlink keepers, no gelato network, no AWS Lambda. Just the chain."

**Visual:** Final card — "IMONMYWAY. Smart Contracts That Wake Themselves Up."

**Narration:**
"IMONMYWAY. Smart contracts that wake themselves up. No server. No keeper. No cron. Built on the Agentic L1."

---

## Production Notes

- **Record in one take** — don't edit. Screen record the explorer + site + you talking.
- **No music** — just your voice + browser clicks. Makes it feel technical and honest.
- **If the LLM callback fires live** — even better. Replace Act 2 with a live initiateCommitment and capture the callback appearing. But have the explorer txns ready as backup.
- **The five txns to bookmark** (open in tabs before recording):

```
1. Deploy:   0xca0303...
2. Subscribe: 0xde2d9b...
3. Authorize: 0x404cd3...
4. Initiate:  0x17e4d2...
5. Callback:  0xdd15a0...
```

- **Core contracts to have open:**

```
Agent:    0x24D16d61De02c29706c51C7a473410a88BF44663
Core:     0x6Ba7C599F33fCBe1A9a5848FDE4D4EFA495A25c9
Registry: 0x81F47d5BD7A79d75ee7d20F5a2cfcfDaf9d05775
```
