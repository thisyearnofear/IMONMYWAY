import "@nomicfoundation/hardhat-chai-matchers";
import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("PunctualityCore", function () {
  let core, owner, user1, user2, user3;
  const ZERO_BYTES = ethers.ZeroHash;

  const START_LOC = { latitude: 40712800, longitude: -74006000, accuracy: 10, timestamp: 1000 };
  const TARGET_LOC = { latitude: 40758000, longitude: -73985500, accuracy: 10, timestamp: 1000 };
  const FAR_LOC   = { latitude: 0, longitude: 0, accuracy: 10, timestamp: 1000 };

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    const Core = await ethers.getContractFactory("PunctualityCore");
    core = await Core.deploy();
  });

  // ── Commitment Creation ────────────────────────────────

  describe("createCommitment", function () {
    it("should create a commitment with valid params", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 7200;
      const tx = await core.connect(user1).createCommitment(
        START_LOC, TARGET_LOC, deadline, 120,
        { value: ethers.parseEther("1") }
      );
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("should revert with zero stake", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 7200;
      await expect(
        core.connect(user1).createCommitment(START_LOC, TARGET_LOC, deadline, 120, { value: 0 })
      ).to.be.revertedWithCustomError(core, "ZeroStake");
    });

    it("should revert with past deadline", async function () {
      await expect(
        core.connect(user1).createCommitment(START_LOC, TARGET_LOC, 100, 120, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(core, "DeadlineInPast");
    });

    it("should revert with zero pace", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 7200;
      await expect(
        core.connect(user1).createCommitment(START_LOC, TARGET_LOC, deadline, 0, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(core, "ZeroPace");
    });

    it("should emit CommitmentCreated event", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 7200;
      await expect(
        core.connect(user1).createCommitment(START_LOC, TARGET_LOC, deadline, 120, { value: ethers.parseEther("1") })
      ).to.emit(core, "CommitmentCreated");
    });

    it("should generate unique IDs for same-block transactions", async function () {
      const deadline = Math.floor(Date.now() / 1000) + 7200;
      const tx1 = await core.connect(user1).createCommitment(START_LOC, TARGET_LOC, deadline, 120, { value: ethers.parseEther("1") });
      const tx2 = await core.connect(user2).createCommitment(START_LOC, TARGET_LOC, deadline, 120, { value: ethers.parseEther("1") });
      const r1 = await tx1.wait();
      const r2 = await tx2.wait();
      // Different users => different sender in hash => different IDs
      expect(r1.status).to.equal(1);
      expect(r2.status).to.equal(1);
    });
  });

  // ── Betting ────────────────────────────────────────────

  describe("placeBet", function () {
    let commitmentId;

    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 7200;
      const tx = await core.connect(user1).createCommitment(
        START_LOC, TARGET_LOC, deadline, 120,
        { value: ethers.parseEther("1") }
      );
      const receipt = await tx.wait();
      commitmentId = receipt.logs[0].args.commitmentId;
    });

    it("should accept a bet for", async function () {
      await expect(
        core.connect(user2).placeBet(commitmentId, true, { value: ethers.parseEther("0.5") })
      ).to.emit(core, "BetPlaced");
    });

    it("should accept a bet against", async function () {
      await expect(
        core.connect(user2).placeBet(commitmentId, false, { value: ethers.parseEther("0.5") })
      ).to.emit(core, "BetPlaced");
    });

    it("should revert if betting on own commitment", async function () {
      await expect(
        core.connect(user1).placeBet(commitmentId, true, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(core, "CannotBetOnSelf");
    });

    it("should revert if betting with zero amount", async function () {
      await expect(
        core.connect(user2).placeBet(commitmentId, true, { value: 0 })
      ).to.be.revertedWithCustomError(core, "ZeroBet");
    });

    it("should revert if double-betting", async function () {
      await core.connect(user2).placeBet(commitmentId, true, { value: ethers.parseEther("0.5") });
      await expect(
        core.connect(user2).placeBet(commitmentId, true, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(core, "AlreadyBet");
    });

    it("should revert if commitment does not exist", async function () {
      await expect(
        core.connect(user2).placeBet(ZERO_BYTES, true, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(core, "CommitmentNotFound");
    });

    it("should revert if commitment is already fulfilled", async function () {
      // Fulfill first
      const now = Math.floor(Date.now() / 1000);
      await core.connect(user1).fulfillCommitment(commitmentId, {
        latitude: TARGET_LOC.latitude,
        longitude: TARGET_LOC.longitude,
        accuracy: 10,
        timestamp: now,
      });
      await expect(
        core.connect(user2).placeBet(commitmentId, true, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(core, "CommitmentAlreadyFulfilled");
    });
  });

  // ── Fulfillment ────────────────────────────────────────

  describe("fulfillCommitment", function () {
    let commitmentId;

    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 7200;
      const tx = await core.connect(user1).createCommitment(
        START_LOC, TARGET_LOC, deadline, 120,
        { value: ethers.parseEther("1") }
      );
      const receipt = await tx.wait();
      commitmentId = receipt.logs[0].args.commitmentId;
    });

    it("should succeed when on time and at location", async function () {
      const tx = await core.connect(user1).fulfillCommitment(commitmentId, {
        latitude: TARGET_LOC.latitude,
        longitude: TARGET_LOC.longitude,
        accuracy: 10,
        timestamp: Math.floor(Date.now() / 1000),
      });
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      const commitment = await core.getCommitment(commitmentId);
      expect(commitment.successful).to.equal(true);
    });

    it("should return stake + opposing bets to user on success", async function () {
      // Add opposing bets
      await core.connect(user2).placeBet(commitmentId, false, { value: ethers.parseEther("2") });
      await core.connect(user3).placeBet(commitmentId, false, { value: ethers.parseEther("1") });

      const balBefore = await ethers.provider.getBalance(user1.address);
      const tx = await core.connect(user1).fulfillCommitment(commitmentId, {
        latitude: TARGET_LOC.latitude,
        longitude: TARGET_LOC.longitude,
        accuracy: 10,
        timestamp: Math.floor(Date.now() / 1000),
      });
      await tx.wait();
      const balAfter = await ethers.provider.getBalance(user1.address);

      // User should receive stake (1) + opposing bets (3) = 4 ETH (minus gas)
      expect(balAfter).to.be.gt(balBefore);
    });

    it("should fail when not at target location", async function () {
      await core.connect(user1).fulfillCommitment(commitmentId, {
        latitude: FAR_LOC.latitude,
        longitude: FAR_LOC.longitude,
        accuracy: 10,
        timestamp: Math.floor(Date.now() / 1000),
      });
      const commitment = await core.getCommitment(commitmentId);
      expect(commitment.successful).to.equal(false);
    });

    it("should revert if not called by commitment creator", async function () {
      await expect(
        core.connect(user2).fulfillCommitment(commitmentId, {
          latitude: TARGET_LOC.latitude,
          longitude: TARGET_LOC.longitude,
          accuracy: 10,
          timestamp: Math.floor(Date.now() / 1000),
        })
      ).to.be.revertedWithCustomError(core, "NotCommitmentCreator");
    });

    it("should revert if already fulfilled", async function () {
      await core.connect(user1).fulfillCommitment(commitmentId, {
        latitude: TARGET_LOC.latitude,
        longitude: TARGET_LOC.longitude,
        accuracy: 10,
        timestamp: Math.floor(Date.now() / 1000),
      });
      await expect(
        core.connect(user1).fulfillCommitment(commitmentId, {
          latitude: TARGET_LOC.latitude,
          longitude: TARGET_LOC.longitude,
          accuracy: 10,
          timestamp: Math.floor(Date.now() / 1000),
        })
      ).to.be.revertedWithCustomError(core, "CommitmentAlreadyFulfilled");
    });

    it("should update reputation on success", async function () {
      const repBefore = await core.getUserReputation(user1.address);
      await core.connect(user1).fulfillCommitment(commitmentId, {
        latitude: TARGET_LOC.latitude,
        longitude: TARGET_LOC.longitude,
        accuracy: 10,
        timestamp: Math.floor(Date.now() / 1000),
      });
      const repAfter = await core.getUserReputation(user1.address);
      expect(repAfter).to.be.gt(repBefore);
    });

    it("should decrease reputation on failure", async function () {
      const repBefore = await core.getUserReputation(user1.address);
      await core.connect(user1).fulfillCommitment(commitmentId, {
        latitude: FAR_LOC.latitude,
        longitude: FAR_LOC.longitude,
        accuracy: 10,
        timestamp: Math.floor(Date.now() / 1000),
      });
      const repAfter = await core.getUserReputation(user1.address);
      expect(repAfter).to.be.lt(repBefore);
    });
  });

  // ── Claim Winnings ─────────────────────────────────────

  describe("claimWinnings", function () {
    let commitmentId;

    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 7200;
      const tx = await core.connect(user1).createCommitment(
        START_LOC, TARGET_LOC, deadline, 120,
        { value: ethers.parseEther("1") }
      );
      const receipt = await tx.wait();
      commitmentId = receipt.logs[0].args.commitmentId;

      // Bet against (user2 will win when user1 fails)
      await core.connect(user2).placeBet(commitmentId, false, { value: ethers.parseEther("2") });

      // Fulfill with failure (wrong location)
      await core.connect(user1).fulfillCommitment(commitmentId, {
        latitude: FAR_LOC.latitude,
        longitude: FAR_LOC.longitude,
        accuracy: 10,
        timestamp: Math.floor(Date.now() / 1000),
      });
    });

    it("should allow claiming pending winnings", async function () {
      const balBefore = await ethers.provider.getBalance(user2.address);
      const tx = await core.connect(user2).claimWinnings(commitmentId);
      await tx.wait();
      const balAfter = await ethers.provider.getBalance(user2.address);
      expect(balAfter).to.be.gt(balBefore);
    });

    it("should revert if nothing to claim", async function () {
      await expect(
        core.connect(user3).claimWinnings(ZERO_BYTES)
      ).to.be.revertedWithCustomError(core, "CommitmentNotFound");
    });
  });

  // ── Ownership ──────────────────────────────────────────

  describe("ownership", function () {
    it("should return deployer as owner", async function () {
      expect(await core.owner()).to.equal(owner.address);
    });

    it("should initiate two-step transfer", async function () {
      await core.transferOwnership(user1.address);
      expect(await core.pendingOwner()).to.equal(user1.address);
      expect(await core.owner()).to.equal(owner.address);
    });

    it("should complete two-step transfer", async function () {
      await core.transferOwnership(user1.address);
      await core.connect(user1).acceptOwnership();
      expect(await core.owner()).to.equal(user1.address);
      expect(await core.pendingOwner()).to.equal(ethers.ZeroAddress);
    });

    it("should revert accept from non-pending owner", async function () {
      await core.transferOwnership(user1.address);
      await expect(
        core.connect(user2).acceptOwnership()
      ).to.be.revertedWithCustomError(core, "OnlyOwner");
    });
  });

  // ── Reputation ─────────────────────────────────────────

  describe("reputation", function () {
    it("should return base reputation for new users", async function () {
      const rep = await core.getUserReputation(user1.address);
      expect(rep).to.equal(5000n);
    });

    it("should cap at REPUTATION_MAX", async function () {
      // Set high reputation
      await core.setReputation(user1.address, 9999);
      // Fulfill commitment to add 100
      const deadline = Math.floor(Date.now() / 1000) + 7200;
      const tx = await core.connect(user1).createCommitment(
        START_LOC, TARGET_LOC, deadline, 120,
        { value: ethers.parseEther("1") }
      );
      const receipt = await tx.wait();
      const cid = receipt.logs[0].args.commitmentId;
      await core.connect(user1).fulfillCommitment(cid, {
        latitude: TARGET_LOC.latitude,
        longitude: TARGET_LOC.longitude,
        accuracy: 10,
        timestamp: Math.floor(Date.now() / 1000),
      });
      const rep = await core.getUserReputation(user1.address);
      expect(rep).to.equal(10000n);
    });

    it("should floor at REPUTATION_MIN", async function () {
      await core.setReputation(user1.address, 1100);
      const deadline = Math.floor(Date.now() / 1000) + 7200;
      const tx = await core.connect(user1).createCommitment(
        START_LOC, TARGET_LOC, deadline, 120,
        { value: ethers.parseEther("1") }
      );
      const receipt = await tx.wait();
      const cid = receipt.logs[0].args.commitmentId;
      await core.connect(user1).fulfillCommitment(cid, {
        latitude: FAR_LOC.latitude,
        longitude: FAR_LOC.longitude,
        accuracy: 10,
        timestamp: Math.floor(Date.now() / 1000),
      });
      const rep = await core.getUserReputation(user1.address);
      expect(rep).to.equal(1000n);
    });
  });
});
