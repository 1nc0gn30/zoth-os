const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { VaelorLatticeNode, VAEL_PER_VLR, levenshteinDistance, normalizeHomoglyphs } = require('../src/core/lattice');

const tmpFile = path.join('/tmp', `vaelor_test_${Date.now()}.json`);
const node = new VaelorLatticeNode(tmpFile);

const snap0 = node.getNetworkSnapshot();
assert(snap0.accountCount >= 5, 'Should bootstrap genesis accounts');
assert(snap0.totalSupplyVlr > 100000, 'Should have initial genesis + PoUW supply');

// 1. Register new @handle with Passkey
const acc = node.registerAccount({
  handle: '@test_bakery',
  displayName: '757 Artisan Bakery',
  initialGrantVlr: 500
});
assert.strictEqual(acc.handle, '@test_bakery');

// 2. Feeless Transfer (<50ms finality, $0 gas)
const tx = node.transfer({
  from: '@test_bakery',
  to: '@neal',
  amountVlr: 25.5,
  memo: 'Custom POS integration test'
});
assert.strictEqual(tx.sendBlock.signatureValid, true, 'Ed25519 signature on SEND block must be valid');
assert.strictEqual(tx.receiveBlock.signatureValid, true, 'Ed25519 signature on RECEIVE block must be valid');
assert.strictEqual(tx.sendBlock.gasFeeVlr, 0, 'Gas fee must be 0 VLR');

// 3. Protected-Pay Escrow + Buyer Chargeback Refund
const esc1 = node.createProtectedEscrow({
  buyer: '@citizen',
  merchant: '@test_bakery',
  amountVlr: 30,
  memo: 'Catering box pre-order',
  protectionHours: 48
});
assert.strictEqual(esc1.escrow.status, 'LOCKED');

const ref1 = node.refundEscrow({
  escrowId: esc1.escrow.id,
  reason: 'Order cancelled within buyer protection window'
});
assert.strictEqual(ref1.escrow.status, 'REFUNDED');

// 4. Proof-of-Useful-Work (PoUW) Minting
const pouw = node.submitUsefulWork({
  worker: '@test_bakery',
  workType: 'SECURITY_ENTROPY_SCAN',
  taskLabel: 'Audited 18 TLS & CSP headers for 757 Artisan Bakery checkout',
  artifactPayload: JSON.stringify({ domain: '757bakery.local', grade: 'A+', headersVerified: 18, issues: 0 })
});
assert(pouw.receipt.rewardVlr >= 14, 'Should mint >= 14 VLR for verified Security Entropy Scan');
assert.strictEqual(pouw.mintBlock.signatureValid, true);

// 5. Payment URI & Invoice Engine
const uriInfo = node.createPaymentUri({
  to: '@test_bakery',
  amountVlr: 19.5,
  memo: 'Artisan Pastry Box',
  protectionHours: 24
});
assert(uriInfo.uri.startsWith('vaelor://pay?to=%40test_bakery&amount=19.50'), 'Must generate valid vaelor:// URI');
const parsedUri = node.parsePaymentUri(uriInfo.uri);
assert.strictEqual(parsedUri.to, '@test_bakery');
assert.strictEqual(parsedUri.amountVlr, 19.5);
assert.strictEqual(parsedUri.protectionHours, 24);
assert.strictEqual(parsedUri.memo, 'Artisan Pastry Box');

const inv1 = node.createInvoice({
  merchant: '@test_bakery',
  amountVlr: 35.0,
  memo: 'Wedding Cupcake Tower Deposit',
  protectionHours: 24,
  expiresInHours: 48
});
assert.strictEqual(inv1.invoice.status, 'UNPAID');
assert(inv1.invoice.id.startsWith('inv_'));

const fetchedInv = node.getInvoice(inv1.invoice.id);
assert.strictEqual(fetchedInv.id, inv1.invoice.id);
assert.strictEqual(fetchedInv.amountVlr, 35.0);

const payRes = node.payInvoice({
  invoiceId: inv1.invoice.id,
  payer: '@citizen'
});
assert.strictEqual(payRes.ok, true);
assert.strictEqual(payRes.invoice.status, 'PAID');
assert.strictEqual(payRes.invoice.paidByHandle, '@citizen');
assert(payRes.invoice.escrowId, 'Must link protected escrow to invoice');
assert.throws(() => node.payInvoice({ invoiceId: inv1.invoice.id, payer: '@citizen' }), /already been paid/);

// 6. Recurring Subscription Allowances (Pull-Pull Guarded Permits)
const sub1 = node.createSubscriptionAllowance({
  subscriber: '@citizen',
  merchant: '@test_bakery',
  amountCapVlr: 25.0,
  period: 'MONTHLY',
  memo: 'Artisan Fresh Loaf Weekly Club'
});
assert.strictEqual(sub1.allowance.status, 'ACTIVE');
assert.strictEqual(sub1.createBlock.type, 'CREATE_ALLOWANCE');
assert.strictEqual(sub1.createBlock.signatureValid, true);
assert.strictEqual(sub1.allowance.amountCapVlr, 25.0);

// Authorized periodic pull within cap
const pull1 = node.pullSubscription({
  allowanceId: sub1.allowance.id,
  amountVlr: 18.0,
  memo: 'Month 1 Artisan Club Delivery'
});
assert.strictEqual(pull1.sendBlock.type, 'SUBSCRIPTION_PULL');
assert.strictEqual(pull1.sendBlock.signatureValid, true);
assert.strictEqual(pull1.receiveBlock.signatureValid, true);
assert.strictEqual(pull1.allowance.currentPeriodSpentVlr, 18.0);
assert.strictEqual(pull1.allowance.pullCount, 1);

// Pull exceeding remaining cap (18 + 10 = 28 > 25) must strictly reject
assert.throws(() => {
  node.pullSubscription({
    allowanceId: sub1.allowance.id,
    amountVlr: 10.0,
    memo: 'Over-cap pull attempt'
  });
}, /Exceeds allowance cap/);

// Revoke allowance in 1 click
const rev1 = node.revokeSubscriptionAllowance({
  allowanceId: sub1.allowance.id,
  subscriber: '@citizen'
});
assert.strictEqual(rev1.allowance.status, 'REVOKED');
assert.strictEqual(rev1.revokeBlock.type, 'REVOKE_ALLOWANCE');
assert.strictEqual(rev1.revokeBlock.signatureValid, true);

// Attempting pull from revoked allowance must fail immediately
assert.throws(() => {
  node.pullSubscription({
    allowanceId: sub1.allowance.id,
    amountVlr: 5.0,
    memo: 'Pull after revocation'
  });
}, /revoked/);

// Snapshot integrity checks
const snapFinal = node.getNetworkSnapshot();
assert(snapFinal.invoices.length >= 2, 'Snapshot must list invoices');
assert(snapFinal.subscriptions.length >= 2, 'Snapshot must list subscriptions');

// 7. Cross-Chain & Fiat Bridge Atomic Swap Engine (VLR ↔ USD / SOL / BTC)
const bridgeRates = node.getBridgeAssetConfig();
assert(bridgeRates.VLR && bridgeRates.USD && bridgeRates.SOL && bridgeRates.BTC, 'Bridge must support VLR, USD, SOL, and BTC');
assert.strictEqual(bridgeRates.VLR.usdRate, 1.00);
assert.strictEqual(bridgeRates.SOL.usdRate, 180.00);

// Zero protocol spread for @zoth ecosystem account
const q1 = node.createBridgeQuote({
  fromAsset: 'USD',
  toAsset: 'VLR',
  amount: 250,
  accountHandle: '@zoth'
});
assert.strictEqual(q1.isZothEcosystem, true);
assert.strictEqual(q1.spreadPct, 0.0);
assert.strictEqual(q1.toAmount, 250.0);

// Execute atomic deposit swap: USD (Stripe) -> VLR minting onto @test_bakery
const swapDeposit = node.executeBridgeSwap({
  quoteId: q1.id,
  accountHandle: '@test_bakery',
  depositTxHash: 'pi_stripe_3N9xK2e9871fa002'
});
assert.strictEqual(swapDeposit.ok, true);
assert.strictEqual(swapDeposit.swap.status, 'SETTLED');
assert.strictEqual(swapDeposit.block.type, 'BRIDGE_MINT');
assert.strictEqual(swapDeposit.block.signatureValid, true);

// Zero-spread check for @zoth ecosystem account
const qZoth = node.createBridgeQuote({
  fromAsset: 'VLR',
  toAsset: 'SOL',
  amount: 180,
  accountHandle: '@zoth'
});
assert.strictEqual(qZoth.spreadPct, 0.0, 'Zero protocol spread for @zoth');
assert.strictEqual(qZoth.toAmount, 1.0, '180 VLR must convert to exactly 1.0 SOL with zero spread');

// Execute atomic redemption swap: VLR -> SOL (Solana DePay)
const q2 = node.createBridgeQuote({
  fromAsset: 'VLR',
  toAsset: 'SOL',
  amount: 180,
  accountHandle: '@test_bakery'
});
assert.strictEqual(q2.spreadPct, 0.25, 'Standard 0.25% spread for non-zoth handles');
assert.strictEqual(q2.toAmount, 0.9975); // 180 VLR / 180 USD/SOL * (1 - 0.0025) = 0.9975 SOL

const swapRedeem = node.executeBridgeSwap({
  quoteId: q2.id,
  accountHandle: '@test_bakery',
  destinationAddress: 'GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK'
});
assert.strictEqual(swapRedeem.ok, true);
assert.strictEqual(swapRedeem.block.type, 'BRIDGE_BURN');
assert.strictEqual(swapRedeem.block.signatureValid, true);

// Overdraft bridge swap must fail
const q3 = node.createBridgeQuote({
  fromAsset: 'VLR',
  toAsset: 'BTC',
  amount: 10_000_000,
  accountHandle: '@test_bakery'
});
assert.throws(() => {
  node.executeBridgeSwap({
    quoteId: q3.id,
    accountHandle: '@test_bakery'
  });
}, /Insufficient VLR balance/);

// 8. Persistent Disk Ledger Snapshot Across Process Restart Verification
assert(fs.existsSync(tmpFile), 'State file must be written to disk');
const nodeReloaded = new VaelorLatticeNode(tmpFile);
const snapReloaded = nodeReloaded.getNetworkSnapshot();

assert(snapReloaded.accountCount >= 6, 'Must reload all accounts including newly registered');
assert(snapReloaded.invoices.length >= 2, 'Invoices must persist across restarts');
assert(snapReloaded.subscriptions.length >= 2, 'Subscriptions must persist across restarts');
assert(snapReloaded.bridgeSwaps.length >= 2, 'Bridge swaps must persist across restarts');
assert(snapReloaded.totalBridgeVolumeUsd > 0, 'Bridge volume must persist across restarts');

const reloadedBakery = nodeReloaded.resolveAccount('@test_bakery');
assert(reloadedBakery, '@test_bakery account must persist on disk');
assert(reloadedBakery.chain.some(b => b.type === 'BRIDGE_MINT'), 'BRIDGE_MINT block must persist in chain');
assert(reloadedBakery.chain.some(b => b.type === 'BRIDGE_BURN'), 'BRIDGE_BURN block must persist in chain');

// 9. 5-Validator BFT Quorum Finality & Quorum Certificate Verification
const snapConsensus = nodeReloaded.getNetworkSnapshot();
assert.strictEqual(snapConsensus.validators.length, 5, 'Consensus ring must feature exactly 5 validators');
assert.strictEqual(snapConsensus.consensusSummary.quorumSize, 5);
assert.strictEqual(snapConsensus.consensusSummary.bftThreshold, 4);

// Test block attestation
const sampleBlock = snapReloaded.recentBlocks[0];
assert(sampleBlock.quorumCertificate, 'Every block on lattice must possess a Quorum Certificate');
assert.strictEqual(sampleBlock.quorumCertificate.quorumSize, 5);
assert.strictEqual(sampleBlock.quorumCertificate.approvals, 5);
assert.strictEqual(sampleBlock.quorumCertificate.status, 'FINALIZED_BFT');
assert.strictEqual(sampleBlock.quorumCertificate.validatorSignatures.length, 5);

// Cryptographically verify all 5 Ed25519 signatures in the certificate
const quorumVerification = nodeReloaded.consensus.verifyQuorumCertificate(sampleBlock, sampleBlock.quorumCertificate);
assert.strictEqual(quorumVerification.valid, true, 'Quorum certificate verification must pass');
assert.strictEqual(quorumVerification.bftFinalized, true);
assert.strictEqual(quorumVerification.approvals, 5);

// Tamper check: altering block hash must fail verification
const tamperedBlock = { ...sampleBlock, hash: '000tampered' + sampleBlock.hash.slice(11) };
const tamperedCheck = nodeReloaded.consensus.verifyQuorumCertificate(tamperedBlock, sampleBlock.quorumCertificate);
assert.strictEqual(tamperedCheck.valid, false, 'Tampered block hash must fail quorum verification');

// 10. Seedless Guardian Social Recovery & 2-of-3 Cryptographic Key Rotation
const bakeryAcc = nodeReloaded.resolveAccount('@test_bakery');
const bakeryBalBefore = bakeryAcc.balanceVael;
const bakeryOldKey = bakeryAcc.publicKeyHex;

// Register 2-of-3 guardian policy
const setGuardRes = nodeReloaded.setGuardianPolicy({
  handle: '@test_bakery',
  guardians: ['@neal', '@zoth', 'passkey_backup_bakery'],
  threshold: 2
});
assert.strictEqual(setGuardRes.account.guardians.length, 3);
assert.strictEqual(setGuardRes.account.guardianThreshold, 2);
assert.strictEqual(setGuardRes.block.type, 'SET_GUARDIANS');
assert(setGuardRes.block.quorumCertificate, 'SET_GUARDIANS block must have quorum certificate');

// Recovery attempt with insufficient approvals must fail
assert.throws(() => {
  nodeReloaded.recoverAccountKey({
    handle: '@test_bakery',
    approvals: ['@neal'] // only 1 approval
  });
}, /Insufficient guardian approvals/);

// Recovery attempt with unauthorized guardian must fail
assert.throws(() => {
  nodeReloaded.recoverAccountKey({
    handle: '@test_bakery',
    approvals: ['@hacker_unknown']
  });
}, /Insufficient guardian approvals/);

// Successful recovery with 2 of 3 guardian approvals (@neal + @zoth)
const recoverRes = nodeReloaded.recoverAccountKey({
  handle: '@test_bakery',
  approvals: ['@neal', '@zoth'],
  reason: 'Lost Android Passkey • Rotating to Sovereign Hardware Key'
});
assert.strictEqual(recoverRes.ok, true);
assert.notStrictEqual(recoverRes.newPublicKeyHex, bakeryOldKey, 'Active public key must be rotated');
assert.strictEqual(bakeryAcc.balanceVael, bakeryBalBefore, '100% of account balance must be preserved');
assert.strictEqual(recoverRes.rotateBlock.type, 'KEY_ROTATE');
assert.strictEqual(recoverRes.rotateBlock.quorumCertificate.approvals, 5);
assert.strictEqual(recoverRes.rotateBlock.data.guardiansApproved.length, 2);

// Verify rotated account can immediately sign new feeless blocks with the new key
const testSendAfterRotation = nodeReloaded.transfer({
  from: '@test_bakery',
  to: '@sprig',
  amountVlr: 5.0,
  memo: 'First payment after seedless guardian rotation'
});
assert.strictEqual(testSendAfterRotation.sendBlock.signatureValid, true, 'Block signed with rotated key must be valid');
assert(testSendAfterRotation.sendBlock.quorumCertificate, 'Send block must receive 5-validator quorum certificate');

// 11. Feeless Per-Second Money Streaming (Creation, Pro-Rata Claim & Cancellation Conservation)
const streamSender = nodeReloaded.resolveAccount('@citizen');
const streamRecipient = nodeReloaded.resolveAccount('@sprig');
const senderBalBefore = streamSender.balanceVael;
const recBalBefore = streamRecipient.balanceVael;

// Create 100 VLR stream over 100 seconds (1.00 VLR/sec)
const streamRes = nodeReloaded.createStream({
  sender: '@citizen',
  recipient: '@sprig',
  totalAmount: 100.0,
  durationSeconds: 100,
  memo: 'Per-second AI inference billing stream'
});

assert.strictEqual(streamRes.stream.ratePerSecondVlr, 1.0);
assert.strictEqual(streamRes.stream.status, 'ACTIVE');
assert.strictEqual(streamRes.createBlock.type, 'STREAM_CREATE');
assert(streamRes.createBlock.quorumCertificate, 'STREAM_CREATE must have 5-validator quorum certificate');
assert.strictEqual(streamSender.balanceVael, senderBalBefore - 100 * 1_000_000, 'Sender balance must lock 100 VLR');

// Simulate pro-rata claim after 40 seconds (40 VLR accrued)
const at40s = new Date(Date.now() + 40_000);
const claimRes = nodeReloaded.claimStream({
  streamId: streamRes.stream.id,
  atTimestamp: at40s
});
assert.strictEqual(claimRes.claimBlock.type, 'STREAM_CLAIM');
assert(claimRes.claimedVlr >= 39.9 && claimRes.claimedVlr <= 40.1, 'Must claim ~40 VLR after 40s');
assert.strictEqual(streamRecipient.balanceVael, recBalBefore + Math.round(claimRes.claimedVlr * 1_000_000));

// Simulate cancellation after 70 seconds (30 more VLR earned, 30 unstreamed VLR refunded)
const at70s = new Date(Date.now() + 70_000);
const cancelRes = nodeReloaded.cancelStream({
  streamId: streamRes.stream.id,
  caller: '@citizen',
  atTimestamp: at70s
});
assert.strictEqual(cancelRes.stream.status, 'CANCELLED');
assert.strictEqual(cancelRes.cancelBlock.type, 'STREAM_CANCEL');

// Mathematical conservation of funds verification
const totalSettledToRecipient = +(claimRes.claimedVlr + cancelRes.settledToRecipientVlr).toFixed(4);
const totalRefundedToSender = cancelRes.refundedToSenderVlr;
assert.strictEqual(+(totalSettledToRecipient + totalRefundedToSender).toFixed(2), 100.00, 'Value conservation: 100% of stream funds accounted for');
assert.strictEqual(streamSender.balanceVael, senderBalBefore - Math.round(totalSettledToRecipient * 1_000_000), 'Sender only pays exact streamed seconds');

// 12. Instant Buyer Cashback Rebates & Atomic Multi-Recipient Split-Pay
const splitPayer = nodeReloaded.resolveAccount('@citizen');
const merchantZoth = nodeReloaded.resolveAccount('@zoth');
const partnerSprig = nodeReloaded.resolveAccount('@sprig');

const payerBalBefore = splitPayer.balanceVael;
const zothBalBefore = merchantZoth.balanceVael;
const sprigBalBefore = partnerSprig.balanceVael;

// Execute atomic split payment: 200 purchase with 2.5% instant buyer cashback (5.00 VLR),
// remaining 195 split: 77.5% of total to @zoth (155 VLR) and 20.0% of total to @sprig (40 VLR)
const splitRes = nodeReloaded.splitTransfer({
  from: '@citizen',
  totalAmount: 200.0,
  splits: [
    { to: '@zoth', bps: 7750, role: 'PRIMARY_MERCHANT' }, // 77.5% of total = 155.00 VLR
    { to: '@sprig', bps: 2000, role: 'PLATFORM_FEE' }     // 20.0% of total = 40.00 VLR
  ],
  cashbackBps: 250,                                       // 2.5% of total = 5.00 VLR instant cashback
  memo: 'Enterprise Zoth Studio License + 757 Local Merchant Platform Fee'
});

assert.strictEqual(splitRes.ok, true);
assert.strictEqual(splitRes.cashbackVlr, 5.0);
assert.strictEqual(splitRes.totalAmountVlr, 200.0);
assert.strictEqual(splitRes.splitSendBlock.type, 'SPLIT_SEND');
assert.strictEqual(splitRes.splitSendBlock.signatureValid, true);
assert(splitRes.splitSendBlock.quorumCertificate, 'SPLIT_SEND must receive 5-validator quorum certificate');
assert.strictEqual(splitRes.cashbackBlock.type, 'CASHBACK_REBATE');
assert.strictEqual(splitRes.cashbackBlock.data.cashbackVlr, 5.0);
assert.strictEqual(splitRes.receiveBlocks.length, 2);

// Recipient balances
assert.strictEqual(merchantZoth.balanceVael, zothBalBefore + 155 * 1_000_000, '@zoth must receive exactly 155 VLR');
assert.strictEqual(partnerSprig.balanceVael, sprigBalBefore + 40 * 1_000_000, '@sprig must receive exactly 40 VLR');

// Payer net deduction: charged 200 VLR - 5 VLR instant cashback = net 195 VLR
assert.strictEqual(splitPayer.balanceVael, payerBalBefore - 195 * 1_000_000, '@citizen must net-pay 195 VLR after instant cashback rebate');

// Test cashback summary query
const cbSummary = nodeReloaded.getCashbackSummary('@citizen');
assert(cbSummary.totalCashbackEarnedVlr >= 5.0, '@citizen must have accumulated cashback record');
assert(cbSummary.cashbackEventCount >= 1, 'Must track cashback rebate events');

// 13. Test Cryptographic Offline Tap-to-Pay Vouchers & Bearer Checks
console.log('Testing Cryptographic Offline Tap-to-Pay Vouchers & Bearer Checks...');
const nealBalBeforeVoucher = nodeReloaded.resolveAccount('@neal').balanceVael;
const voucherIssueRes = nodeReloaded.issueVoucher({
  issuer: '@neal',
  amount: 50.0,
  claimSecret: '7570',
  memo: 'Artisan Bakery Tap-to-Pay Bearer Check #44'
});

assert.strictEqual(voucherIssueRes.voucher.status, 'ACTIVE');
assert.strictEqual(voucherIssueRes.voucher.amountVlr, 50.0);
assert.strictEqual(voucherIssueRes.voucher.hasPin, true);
assert(voucherIssueRes.voucher.uri.startsWith('vaelor://voucher?id='), 'Voucher URI must be generated');
assert.strictEqual(voucherIssueRes.issueBlock.type, 'VOUCHER_ISSUE');
assert.strictEqual(voucherIssueRes.issueBlock.signatureValid, true);
assert(voucherIssueRes.issueBlock.quorumCertificate, 'VOUCHER_ISSUE must receive 5-validator quorum certificate');

// Neal's balance should be debited 50 VLR immediately
const nealBalAfterVoucher = nodeReloaded.resolveAccount('@neal').balanceVael;
assert.strictEqual(nealBalAfterVoucher, nealBalBeforeVoucher - 50 * 1_000_000, 'Issuer balance must be debited on voucher issuance');

// Attempt redemption with wrong PIN -> should throw
assert.throws(() => {
  nodeReloaded.redeemVoucher({
    voucherId: voucherIssueRes.voucher.id,
    redeemer: '@zoth',
    claimSecret: 'wrong_pin'
  });
}, /Invalid claim PIN/, 'Redemption with incorrect PIN must fail');

// Successful redemption with correct PIN
const zothBalBeforeRedeem = nodeReloaded.resolveAccount('@zoth').balanceVael;
const redeemRes = nodeReloaded.redeemVoucher({
  voucherId: voucherIssueRes.voucher.id,
  redeemer: '@zoth',
  claimSecret: '7570'
});

assert.strictEqual(redeemRes.voucher.status, 'REDEEMED');
assert.strictEqual(redeemRes.redeemBlock.type, 'VOUCHER_REDEEM');
assert.strictEqual(redeemRes.redeemBlock.signatureValid, true);
assert(redeemRes.redeemBlock.quorumCertificate, 'VOUCHER_REDEEM must receive 5-validator quorum certificate');

const zothBalAfterRedeem = nodeReloaded.resolveAccount('@zoth').balanceVael;
assert.strictEqual(zothBalAfterRedeem, zothBalBeforeRedeem + 50 * 1_000_000, 'Redeemer balance must be credited 50 VLR');

// Double-spend / double-redemption must fail
assert.throws(() => {
  nodeReloaded.redeemVoucher({
    voucherId: voucherIssueRes.voucher.id,
    redeemer: '@zoth',
    claimSecret: '7570'
  });
}, /cannot be redeemed; status is REDEEMED/, 'Double-redemption must be rejected atomically');

// Test voucher cancellation & refund
const treasuryBalBeforeVch = nodeReloaded.resolveAccount('@treasury').balanceVael;
const vch2 = nodeReloaded.issueVoucher({
  issuer: '@treasury',
  amount: 25.0,
  claimSecret: '',
  memo: 'Unclaimed Community Seed Voucher'
});
assert.strictEqual(nodeReloaded.resolveAccount('@treasury').balanceVael, treasuryBalBeforeVch - 25 * 1_000_000);

const vchCancelRes = nodeReloaded.cancelVoucher({
  voucherId: vch2.voucher.id,
  caller: '@treasury'
});
assert.strictEqual(vchCancelRes.voucher.status, 'CANCELLED');
assert.strictEqual(vchCancelRes.refundedAmountVlr, 25.0);
assert.strictEqual(vchCancelRes.cancelBlock.type, 'VOUCHER_CANCEL');
assert.strictEqual(vchCancelRes.cancelBlock.signatureValid, true);
assert.strictEqual(nodeReloaded.resolveAccount('@treasury').balanceVael, treasuryBalBeforeVch, 'Issuer must receive 100% refund on voucher cancellation');

// Redemptions on cancelled vouchers must fail
assert.throws(() => {
  nodeReloaded.redeemVoucher({
    voucherId: vch2.voucher.id,
    redeemer: '@zoth'
  });
}, /cannot be redeemed; status is CANCELLED/, 'Redemption on cancelled voucher must fail');

// Check snapshot counters
const finalSnap = nodeReloaded.getNetworkSnapshot();
assert(finalSnap.totalVouchersCount >= 2, 'Snapshot must list vouchers');
assert(Array.isArray(finalSnap.vouchers), 'Snapshot must return vouchers array');

// 14. Test Zero-Lockup PoUW Compute Savings Vaults (8.5% Real-Yield APY)
console.log('Testing Zero-Lockup PoUW Compute Savings Vaults (8.5% APY)...');

// Verify boot seeding of @neal (25,000 VLR) and @zoth (15,000 VLR)
const vaultSnap = nodeReloaded.getNetworkSnapshot();
assert.strictEqual(vaultSnap.savingsVaultSummary.apyPct, 8.5, 'Savings Vault must offer 8.5% Real-Yield APY');
assert(vaultSnap.totalStakedVlr >= 40000.0, 'Must reflect seeded savings stakes');
assert(vaultSnap.activeStakersCount >= 2, 'Must have at least 2 active stakers');

const nealStakedAcc = nodeReloaded.resolveAccount('@neal');
const zothStakedAcc = nodeReloaded.resolveAccount('@zoth');
assert.strictEqual(nealStakedAcc.stakedBalanceVael, 25000 * 1_000_000, '@neal must have 25,000 VLR in savings vault');
assert.strictEqual(zothStakedAcc.stakedBalanceVael, 15000 * 1_000_000, '@zoth must have 15,000 VLR in savings vault');

// Register new citizen saver
const alice = nodeReloaded.registerAccount({
  handle: '@saver_alice',
  displayName: 'Alice (Independent Researcher)',
  initialGrantVlr: 2000.0
});
const aliceBalInitial = alice.balanceVael;
assert.strictEqual(alice.stakedBalanceVael, 0);

// Alice deposits 1,200 VLR into Zero-Lockup Savings Vault
const depositRes = nodeReloaded.stakeDeposit({
  handle: '@saver_alice',
  amount: 1200.0,
  validatorId: 'val-delta-zothos-local'
});

assert.strictEqual(depositRes.stakedAmountVlr, 1200.0);
assert.strictEqual(depositRes.totalStakedVlr, 1200.0);
assert.strictEqual(depositRes.depositBlock.type, 'STAKE_DEPOSIT');
assert.strictEqual(depositRes.depositBlock.signatureValid, true);
assert(depositRes.depositBlock.quorumCertificate, 'STAKE_DEPOSIT must receive 5-validator BFT quorum certificate');

// Check Alice's balance deduction and stake allocation
const aliceAfterDep = nodeReloaded.resolveAccount('@saver_alice');
assert.strictEqual(aliceAfterDep.balanceVael, aliceBalInitial - 1200 * 1_000_000, 'Liquid balance must deduct 1,200 VLR');
assert.strictEqual(aliceAfterDep.stakedBalanceVael, 1200 * 1_000_000, 'Staked balance must reflect 1,200 VLR');
assert.strictEqual(aliceAfterDep.stakedValidatorId, 'val-delta-zothos-local');

// Check real-time yield calculation
const pendingYieldVael = nodeReloaded.calculateAccruedYieldVael(aliceAfterDep);
assert(pendingYieldVael > 0, 'Yield must accrue deterministically');

// Alice harvests accrued yield
const aliceLiquidBeforeHarvest = aliceAfterDep.balanceVael;
const harvestRes = nodeReloaded.harvestYield({ handle: '@saver_alice' });

assert.strictEqual(harvestRes.harvestBlock.type, 'STAKE_HARVEST');
assert.strictEqual(harvestRes.harvestBlock.signatureValid, true);
assert(harvestRes.harvestBlock.quorumCertificate, 'STAKE_HARVEST must receive 5-validator BFT quorum certificate');
assert(harvestRes.harvestedYieldVlr > 0, 'Harvested yield must be greater than 0');

const aliceAfterHarvest = nodeReloaded.resolveAccount('@saver_alice');
assert.strictEqual(aliceAfterHarvest.balanceVael, aliceLiquidBeforeHarvest + harvestRes.harvestedYieldVael, 'Liquid balance must be credited harvested yield');
assert.strictEqual(aliceAfterHarvest.stakedBalanceVael, 1200 * 1_000_000, 'Principal stake must remain intact during harvest');

// Partial instant unstake (500 VLR) with zero lockup penalty and $0 gas
const aliceLiquidBeforeUnstake = aliceAfterHarvest.balanceVael;
const withdrawRes1 = nodeReloaded.stakeWithdraw({
  handle: '@saver_alice',
  amount: 500.0
});

assert.strictEqual(withdrawRes1.withdrawnVlr, 500.0);
assert.strictEqual(withdrawRes1.remainingStakedVlr, 700.0);
assert.strictEqual(withdrawRes1.withdrawBlock.type, 'STAKE_WITHDRAW');
assert.strictEqual(withdrawRes1.withdrawBlock.signatureValid, true);
assert.strictEqual(withdrawRes1.withdrawBlock.data.gasFeeVlr, 0, 'Gas fee must be $0.00');
assert.strictEqual(withdrawRes1.withdrawBlock.data.penaltyVlr, 0, 'Lockup penalty must be 0');

const aliceAfterUnstake1 = nodeReloaded.resolveAccount('@saver_alice');
assert.strictEqual(aliceAfterUnstake1.stakedBalanceVael, 700 * 1_000_000, 'Remaining stake must be 700 VLR');
assert(aliceAfterUnstake1.balanceVael >= aliceLiquidBeforeUnstake + 500 * 1_000_000, 'Liquid balance must be refunded 500 VLR');

// Full instant unstake (amount: 'ALL')
const withdrawRes2 = nodeReloaded.stakeWithdraw({
  handle: '@saver_alice',
  amount: 'ALL'
});

assert.strictEqual(withdrawRes2.withdrawnVlr, 700.0);
assert.strictEqual(withdrawRes2.remainingStakedVlr, 0.0);
const aliceFinal = nodeReloaded.resolveAccount('@saver_alice');
assert.strictEqual(aliceFinal.stakedBalanceVael, 0, 'Staked balance must be 0 after full unstake');
assert(aliceFinal.balanceVael >= 2000 * 1_000_000, 'Alice must conserve original principal + earned yield');

// Attempt withdrawal on 0 stake must fail
assert.throws(() => {
  nodeReloaded.stakeWithdraw({ handle: '@saver_alice', amount: 100 });
}, /No active stake/, 'Unstaking with zero staked balance must fail');

// Attempt harvest on 0 stake must fail
assert.throws(() => {
  nodeReloaded.harvestYield({ handle: '@saver_alice' });
}, /No active stake/, 'Harvesting with zero staked balance must fail');

// Staking overview helper check
const overview = nodeReloaded.getStakingOverview('@neal');
assert.strictEqual(overview.ok, true);
assert.strictEqual(overview.apyPct, 8.5);
assert.strictEqual(overview.userStake.handle, '@neal');
assert.strictEqual(overview.userStake.stakedBalanceVlr, 25000.0);

// ==========================================
// FEATURE 15: Cryptographic Itemized Smart Receipts, Digital Warranties & 1-Click Accounting CSV Export
// ==========================================
console.log('Testing Cryptographic Itemized Smart Receipts & Accounting CSV Export...');

// 1. Verify default seed receipts on boot
const seedReceipts = nodeReloaded.getReceiptsForHandle('@all');
assert(seedReceipts.length >= 3, 'Must have at least 3 seeded smart receipts');
const zothProReceipt = seedReceipts.find((r) => r.memo && r.memo.includes('Zoth Studio Sovereign AI Pro Tier'));
assert(zothProReceipt, 'Zoth Studio Pro lifetime license receipt must exist');
assert.strictEqual(zothProReceipt.buyerHandle, '@neal');
assert.strictEqual(zothProReceipt.merchantHandle, '@zoth');
assert.strictEqual(zothProReceipt.category, 'SaaS & AI Tools');
assert.strictEqual(zothProReceipt.items.length, 1);
assert.strictEqual(zothProReceipt.items[0].unitPrice, 79.0);
assert.strictEqual(zothProReceipt.grossVlr, 79.0);
assert.strictEqual(zothProReceipt.isWarrantyActive, true);
assert.strictEqual(zothProReceipt.quorumStatus, 'FINALIZED_BFT');

// 2. Create a new itemized smart receipt from @citizen to @sprig with multiple line items
const citizenBeforeRcp = nodeReloaded.resolveAccount('@citizen');
const sprigBeforeRcp = nodeReloaded.resolveAccount('@sprig');
const rcpCitizenBalBefore = citizenBeforeRcp.balanceVael;
const rcpSprigBalBefore = sprigBeforeRcp.balanceVael;

const rcpRes = nodeReloaded.createSmartReceipt({
  buyer: '@citizen',
  merchant: '@sprig',
  items: [
    { name: 'Organic Cold-Pressed Green Juice', qty: 2, unitPrice: 7.50 },
    { name: 'Avocado Toast with Heirloom Tomatoes', qty: 1, unitPrice: 14.00 }
  ],
  category: 'Food & Dining',
  cashbackBps: 250, // 2.5% instant buyer rebate
  warrantyDays: 60,
  memo: 'Farm-to-Table Lunch Order #757-992'
});

assert.strictEqual(rcpRes.ok, true);
assert(rcpRes.receipt.id.startsWith('rcp_'));
assert.strictEqual(rcpRes.receipt.grossVlr, 29.00); // (2 * 7.50) + 14.00 = 29.00
assert.strictEqual(rcpRes.receipt.cashbackVlr, 0.725); // 29.00 * 0.025 = 0.725
assert.strictEqual(rcpRes.receipt.netVlr, 28.275); // 29.00 - 0.725 = 28.275
assert.strictEqual(rcpRes.receipt.items.length, 2);
assert.strictEqual(rcpRes.receipt.isWarrantyActive, true);
assert.strictEqual(rcpRes.receiptBlock.type, 'SMART_RECEIPT');
assert.strictEqual(rcpRes.receiptBlock.signatureValid, true);
assert(rcpRes.receiptBlock.quorumCertificate, 'SMART_RECEIPT block must have BFT Quorum Certificate');
assert.strictEqual(rcpRes.receiptBlock.quorumCertificate.status, 'FINALIZED_BFT');
assert.strictEqual(rcpRes.receiveBlock.type, 'RECEIVE');
assert.strictEqual(rcpRes.receiveBlock.signatureValid, true);

// Verify exact balance accounting:
// Sprig gets gross (29.00 VLR), Citizen pays net (28.275 VLR after 2.5% cashback rebate)
const citizenAfterRcp = nodeReloaded.resolveAccount('@citizen');
const sprigAfterRcp = nodeReloaded.resolveAccount('@sprig');
assert.strictEqual(sprigAfterRcp.balanceVael, rcpSprigBalBefore + 29 * 1_000_000);
assert.strictEqual(citizenAfterRcp.balanceVael, rcpCitizenBalBefore - Math.round(28.275 * 1_000_000));

// 3. Query receipts for @citizen and @sprig
const citizenReceipts = nodeReloaded.getReceiptsForHandle('@citizen');
assert(citizenReceipts.some((r) => r.id === rcpRes.receipt.id), 'Citizen receipts must include the new receipt');
const sprigReceipts = nodeReloaded.getReceiptsForHandle('@sprig');
assert(sprigReceipts.some((r) => r.id === rcpRes.receipt.id), 'Sprig receipts must include the new receipt');

// 4. Test 1-click accounting CSV reconciliation statement export
const csvAll = nodeReloaded.exportReceiptsCsv('@all');
assert(csvAll.includes('Receipt ID,Date,Buyer,Merchant,Category,Gross VLR,Cashback VLR,Net VLR,Warranty Until,Block Hash,Quorum Status'), 'CSV must include header row');
assert(csvAll.includes(rcpRes.receipt.id), 'CSV must contain new receipt ID');
assert(csvAll.includes('"Food & Dining"'), 'CSV must contain escaped category');
assert(csvAll.includes('29.00'), 'CSV must contain gross amount');
assert(csvAll.includes('0.73') || csvAll.includes('0.72'), 'CSV must contain cashback');

const csvSprig = nodeReloaded.exportReceiptsCsv('@sprig');
const csvSprigLines = csvSprig.trim().split('\n');
assert(csvSprigLines.length >= 3, 'Sprig CSV must have header + at least 2 receipt rows');

// 5. Test validation & error handling
assert.throws(() => {
  nodeReloaded.createSmartReceipt({
    buyer: '@citizen',
    merchant: '@citizen',
    items: [{ name: 'Test', qty: 1, unitPrice: 10 }]
  });
}, /same/, 'Self-checkout receipt must be rejected');

assert.throws(() => {
  nodeReloaded.createSmartReceipt({
    buyer: '@citizen',
    merchant: '@sprig',
    items: []
  });
}, /at least one line item/, 'Empty line items must be rejected');

assert.throws(() => {
  nodeReloaded.createSmartReceipt({
    buyer: '@citizen',
    merchant: '@sprig',
    items: [{ name: 'Overpriced item', qty: 1, unitPrice: 99999999 }]
  });
}, /Insufficient/, 'Insufficient buyer balance must be rejected');

// ==========================================
// FEATURE 16: Autonomous AI Agent M2M Micro-Contract & Bounty Exchange
// ==========================================
console.log('Testing Autonomous AI Agent M2M Micro-Contract Bounties...');

// 1. Verify default seed bounties on boot (2 OPEN, 1 SETTLED)
const initialBounties = nodeReloaded.getBounties();
assert(initialBounties.length >= 3, 'Must have at least 3 initial bounties');
const openBounties = nodeReloaded.getBounties('OPEN');
const settledBounties = nodeReloaded.getBounties('SETTLED');
assert(openBounties.length >= 2, 'Must have at least 2 OPEN bounties');
assert(settledBounties.length >= 1, 'Must have at least 1 SETTLED bounty');

const dijkstraBty = initialBounties.find((b) => b.title.includes('Dijkstra'));
assert(dijkstraBty, 'Dijkstra routing kernel bounty must exist');
assert.strictEqual(dijkstraBty.posterHandle, '@neal');
assert.strictEqual(dijkstraBty.rewardVlr, 45.0);
assert.strictEqual(dijkstraBty.status, 'OPEN');
assert.strictEqual(dijkstraBty.requiredProofType, 'SHA256_AST_PROOF');

const settledQrBty = settledBounties.find((b) => b.title.includes('Micro-Receipt QR Encoder'));
assert(settledQrBty, 'Settled QR encoder bounty must exist');
assert.strictEqual(settledQrBty.status, 'SETTLED');
assert.strictEqual(settledQrBty.claimantHandle, '@citizen');
assert(settledQrBty.deliverableProofHash.startsWith('prf_'));

// 2. Post a new M2M micro-contract bounty by @zoth
const zothAccBeforeBty = nodeReloaded.resolveAccount('@zoth');
const zothBalBeforeBty = zothAccBeforeBty.balanceVael;
const zothLockedBeforeBty = zothAccBeforeBty.lockedEscrowVael;

const postRes = nodeReloaded.postBounty({
  poster: '@zoth',
  title: 'GPU Tensor Matrix Multi-Head Attention Kernel',
  category: 'AI & Security',
  rewardAmount: 20.0,
  requiredProofType: 'BENCHMARK_TELEMETRY',
  description: 'Provide micro-second latency benchmarks for 8-head FP16 attention kernel.'
});

assert.strictEqual(postRes.ok, true);
assert(postRes.bounty.id.startsWith('bty_'));
assert.strictEqual(postRes.bounty.status, 'OPEN');
assert.strictEqual(postRes.bounty.rewardVlr, 20.0);
assert.strictEqual(postRes.postBlock.type, 'BOUNTY_POST');
assert.strictEqual(postRes.postBlock.signatureValid, true);
assert.strictEqual(postRes.postBlock.quorumCertificate.status, 'FINALIZED_BFT');

// Verify balance deducted and lockedEscrow incremented
const zothAccAfterPost = nodeReloaded.resolveAccount('@zoth');
assert.strictEqual(zothAccAfterPost.balanceVael, zothBalBeforeBty - 20 * 1_000_000);
assert.strictEqual(zothAccAfterPost.lockedEscrowVael, zothLockedBeforeBty + 20 * 1_000_000);

// 3. Settle the bounty with a verifiable deliverable by @citizen
const citizenAccBeforeBty = nodeReloaded.resolveAccount('@citizen');
const citizenBalBeforeBty = citizenAccBeforeBty.balanceVael;
const citizenPouwBefore = citizenAccBeforeBty.pouwScore || 0;

const settleRes = nodeReloaded.settleBounty({
  bountyId: postRes.bounty.id,
  claimant: '@citizen',
  deliverableSummary: 'FP16 8-head attention kernel tested at 0.42ms per batch on Apple M-series Metal backend.',
  deliverablePayload: { kernel: 'attention_fp16.metal', latencyMs: 0.42, throughputGFlops: 3820 }
});

assert.strictEqual(settleRes.ok, true);
assert.strictEqual(settleRes.bounty.status, 'SETTLED');
assert.strictEqual(settleRes.bounty.claimantHandle, '@citizen');
assert(settleRes.bounty.deliverableProofHash.startsWith('prf_'));
assert.strictEqual(settleRes.settleBlock.type, 'BOUNTY_SETTLE');
assert.strictEqual(settleRes.settleBlock.signatureValid, true);
assert.strictEqual(settleRes.settleBlock.quorumCertificate.status, 'FINALIZED_BFT');

// Verify claimant balance increased and PoUW score boosted
const citizenAccAfterSettle = nodeReloaded.resolveAccount('@citizen');
assert.strictEqual(citizenAccAfterSettle.balanceVael, citizenBalBeforeBty + 20 * 1_000_000);
assert.strictEqual(citizenAccAfterSettle.pouwScore, citizenPouwBefore + 1);

// Verify poster's lockedEscrow was decremented
const zothAccAfterSettle = nodeReloaded.resolveAccount('@zoth');
assert.strictEqual(zothAccAfterSettle.lockedEscrowVael, zothLockedBeforeBty);

// 4. Double-claim rejection
assert.throws(() => {
  nodeReloaded.settleBounty({
    bountyId: postRes.bounty.id,
    claimant: '@sprig',
    deliverableSummary: 'Attempt to claim already settled bounty'
  });
}, /Cannot settle: bounty is already SETTLED/, 'Double-claim on settled bounty must throw');

// 5. Post and Cancel/Refund test
const nealAccBeforeCancel = nodeReloaded.resolveAccount('@neal');
const nealBalBeforeCancel = nealAccBeforeCancel.balanceVael;
const nealLockedBeforeCancel = nealAccBeforeCancel.lockedEscrowVael;

const bountyCancelPostRes = nodeReloaded.postBounty({
  poster: '@neal',
  title: 'Temporary Test Bounty for Cancellation',
  rewardAmount: 15.0,
  category: 'Experimental'
});
assert.strictEqual(bountyCancelPostRes.ok, true);
assert.strictEqual(bountyCancelPostRes.bounty.status, 'OPEN');

// Non-poster cannot cancel
assert.throws(() => {
  nodeReloaded.cancelBounty({
    bountyId: bountyCancelPostRes.bounty.id,
    caller: '@sprig'
  });
}, /Only bounty poster/, 'Non-poster cancellation must be rejected');

// Poster cancels
const bountyCancelRes = nodeReloaded.cancelBounty({
  bountyId: bountyCancelPostRes.bounty.id,
  caller: '@neal'
});
assert.strictEqual(bountyCancelRes.ok, true);
assert.strictEqual(bountyCancelRes.bounty.status, 'CANCELLED');
assert.strictEqual(bountyCancelRes.cancelBlock.type, 'BOUNTY_CANCEL');
assert.strictEqual(bountyCancelRes.cancelBlock.signatureValid, true);

// Verify balance fully refunded
const nealAccAfterCancel = nodeReloaded.resolveAccount('@neal');
assert.strictEqual(nealAccAfterCancel.balanceVael, nealBalBeforeCancel);
assert.strictEqual(nealAccAfterCancel.lockedEscrowVael, nealLockedBeforeCancel);

// Cannot cancel already cancelled bounty
assert.throws(() => {
  nodeReloaded.cancelBounty({
    bountyId: bountyCancelPostRes.bounty.id,
    caller: '@neal'
  });
}, /Cannot cancel: bounty is already CANCELLED/, 'Re-cancellation must throw');

// ==========================================
// FEATURE 17: Verified Merchant Directory, Reputation & Anti-Phishing Lookalike Guard
// ==========================================
console.log('Testing Feature 17: Verified Directory, Anti-Phishing Guard & On-Lattice Reviews...');

// 1. Directory presence on boot
const directory = nodeReloaded.getDirectory();
assert(Array.isArray(directory), 'Directory must be an array');
assert(directory.length >= 4, 'Must seed at least 4 verified merchants');
const nealEntry = directory.find((d) => d.handle === '@neal');
assert(nealEntry, 'Merchant @neal must exist in verified directory');
assert.strictEqual(nealEntry.domain, 'nealfrazier.tech');
assert(nealEntry.trustScore >= 95, 'Trust score should be high for verified merchants');
assert(nealEntry.ratingAvg >= 4.5, 'Rating average should be seeded');

// 2. Anti-Phishing Lookalike Guard Tests
// 2a. Verified Safe Handles
const safeNeal = nodeReloaded.checkHandleSafety('@neal');
assert.strictEqual(safeNeal.safe, true);
assert.strictEqual(safeNeal.riskLevel, 'VERIFIED_SAFE');
assert.strictEqual(safeNeal.domain, 'nealfrazier.tech');

const safeZoth = nodeReloaded.checkHandleSafety('@zoth');
assert.strictEqual(safeZoth.safe, true);
assert.strictEqual(safeZoth.riskLevel, 'VERIFIED_SAFE');

// 2b. Homoglyph Substitution Attacks
const phishZoth0 = nodeReloaded.checkHandleSafety('@z0th');
assert.strictEqual(phishZoth0.safe, false);
assert.strictEqual(phishZoth0.riskLevel, 'HIGH_LOOKALIKE_RISK');
assert.strictEqual(phishZoth0.suggestedHandle, '@zoth');

const phishNeal1 = nodeReloaded.checkHandleSafety('@nea1');
assert.strictEqual(phishNeal1.safe, false);
assert.strictEqual(phishNeal1.riskLevel, 'HIGH_LOOKALIKE_RISK');
assert.strictEqual(phishNeal1.suggestedHandle, '@neal');

const phishSprigQ = nodeReloaded.checkHandleSafety('@spriq');
assert.strictEqual(phishSprigQ.safe, false);
assert.strictEqual(phishSprigQ.riskLevel, 'HIGH_LOOKALIKE_RISK');
assert.strictEqual(phishSprigQ.suggestedHandle, '@sprig');

// 2c. Levenshtein Distance 1 Typosquatting Attacks
const phishZoths = nodeReloaded.checkHandleSafety('@zoths');
assert.strictEqual(phishZoths.safe, false);
assert.strictEqual(phishZoths.riskLevel, 'HIGH_LOOKALIKE_RISK');
assert.strictEqual(phishZoths.suggestedHandle, '@zoth');

// 2d. Legitimate Unverified Community Handles
const safeCommunity = nodeReloaded.checkHandleSafety('@coffee757');
assert.strictEqual(safeCommunity.safe, true);
assert.strictEqual(safeCommunity.riskLevel, 'UNVERIFIED_COMMUNITY');
assert.strictEqual(safeCommunity.suggestedHandle, null);

// 3. Submit On-Lattice Merchant Review
const reviewsCountBefore = (nodeReloaded.state.merchantReviews || []).length;
const nealReviewCountBefore = nealEntry.reviewCount;
const reviewRes = nodeReloaded.submitMerchantReview({
  reviewer: '@citizen',
  merchant: '@neal',
  rating: 5,
  comment: 'Top-tier sovereign cryptography and $0.00 gas POS integration!'
});

assert.strictEqual(reviewRes.ok, true);
assert.strictEqual(reviewRes.review.reviewer, '@citizen');
assert.strictEqual(reviewRes.review.merchant, '@neal');
assert.strictEqual(reviewRes.review.rating, 5);
assert.strictEqual(reviewRes.reviewBlock.type, 'MERCHANT_REVIEW');
assert.strictEqual(reviewRes.reviewBlock.signatureValid, true, 'Review block Ed25519 signature must be valid');
assert(reviewRes.reviewBlock.quorumCertificate, 'Review block must have BFT quorum certificate');
assert.strictEqual(reviewRes.reviewBlock.quorumCertificate.status, 'FINALIZED_BFT');
assert(reviewRes.reviewBlock.quorumCertificate.validatorSignatures.length >= 4, 'Quorum signatures must meet BFT threshold');
assert.strictEqual(reviewRes.reviewBlock.quorumCertificate.approvals, 5);

// Verify updated directory record
assert.strictEqual(reviewRes.merchantDirectory.reviewCount, nealReviewCountBefore + 1);
assert.strictEqual((nodeReloaded.state.merchantReviews || []).length, reviewsCountBefore + 1);

// 4. Rejection Guards
// 4a. Self-review rejected
assert.throws(() => {
  nodeReloaded.submitMerchantReview({
    reviewer: '@neal',
    merchant: '@neal',
    rating: 5,
    comment: 'Self-serving review'
  });
}, /Self-reviews are not permitted/, 'Self-review must throw');

// 4b. Rating out of bounds
assert.throws(() => {
  nodeReloaded.submitMerchantReview({
    reviewer: '@citizen',
    merchant: '@neal',
    rating: 0,
    comment: 'Invalid rating'
  });
}, /rating must be an integer between 1 and 5/i, 'Rating 0 must throw');

assert.throws(() => {
  nodeReloaded.submitMerchantReview({
    reviewer: '@citizen',
    merchant: '@neal',
    rating: 6,
    comment: 'Invalid rating'
  });
}, /rating must be an integer between 1 and 5/i, 'Rating 6 must throw');

// 4c. Non-existent accounts
assert.throws(() => {
  nodeReloaded.submitMerchantReview({
    reviewer: '@citizen',
    merchant: '@ghost_merchant_xyz',
    rating: 5,
    comment: 'Unknown merchant'
  });
}, /Merchant account.*not found/, 'Nonexistent merchant must throw');

// 5. Network Snapshot Integration
const finalSnapshot = nodeReloaded.getNetworkSnapshot();
assert(Array.isArray(finalSnapshot.directory), 'Snapshot must contain directory array');
assert(finalSnapshot.totalVerifiedMerchantsCount >= 4, 'Snapshot must report totalVerifiedMerchantsCount');
assert(finalSnapshot.totalReviewsCount >= 1, 'Snapshot must report totalReviewsCount');

// 6. Test exported algorithms
assert.strictEqual(levenshteinDistance('vaelor', 'vaelor'), 0);
assert.strictEqual(levenshteinDistance('zoth', 'zoths'), 1);
assert.strictEqual(normalizeHomoglyphs('z0th'), 'zoth');
assert.strictEqual(normalizeHomoglyphs('nea1'), 'neal');

// ==========================================
// FEATURE 18: Delegated Team & Agent Sub-Accounts (Daily Caps + Freeze)
// ==========================================
console.log('Testing Feature 18: Delegated Sub-Accounts, Daily Caps & 1-Click Freeze...');

// 1. Seeded default sub-accounts on boot
const seededSubs = nodeReloaded.getSubAccounts();
assert(Array.isArray(seededSubs), 'Sub-accounts must be an array');
assert(seededSubs.length >= 3, 'Must seed at least 3 default sub-accounts');
const zothHermes = seededSubs.find((s) => s.subHandle === '@zoth.hermes');
assert(zothHermes, 'Seeded @zoth.hermes must exist');
assert.strictEqual(zothHermes.parentHandle, '@zoth');
assert.strictEqual(zothHermes.dailyLimitVlr, 250.0);
assert.strictEqual(zothHermes.status, 'ACTIVE');
assert.strictEqual(zothHermes.isFrozen, false);

// 2. Create new delegated sub-account virtual card
const createSubRes = nodeReloaded.createSubAccount({
  parentHandle: '@test_bakery',
  subHandle: '@test_bakery.courier',
  label: 'Bakery Delivery Driver & Van Maintenance Card',
  dailyLimitVlr: 30.0,
  allowedCategories: ['Transport & Logistics', 'Food & Dining', 'ALL']
});
assert.strictEqual(createSubRes.ok, true);
assert(createSubRes.subAccount.id.startsWith('sub_'));
assert.strictEqual(createSubRes.subAccount.parentHandle, '@test_bakery');
assert.strictEqual(createSubRes.subAccount.subHandle, '@test_bakery.courier');
assert.strictEqual(createSubRes.subAccount.dailyLimitVlr, 30.0);
assert.strictEqual(createSubRes.subAccount.spentTodayVlr, 0);
assert.strictEqual(createSubRes.subAccount.remainingTodayVlr, 30.0);
assert.strictEqual(createSubRes.createBlock.type, 'SUBACCOUNT_CREATE');
assert.strictEqual(createSubRes.createBlock.signatureValid, true);
assert.strictEqual(createSubRes.createBlock.quorumCertificate.status, 'FINALIZED_BFT');

// 3. Spend within daily limit
const subBakeryAccBefore = nodeReloaded.resolveAccount('@test_bakery');
const subSprigAccBefore = nodeReloaded.resolveAccount('@sprig');
const subBakeryBalBefore = subBakeryAccBefore.balanceVael;
const subSprigBalBefore = subSprigAccBefore.balanceVael;

const spendRes = nodeReloaded.spendFromSubAccount({
  subAccountId: createSubRes.subAccount.id,
  recipient: '@sprig',
  amount: 12.5,
  memo: 'Flour delivery fee & catering packaging',
  category: 'Transport & Logistics'
});

assert.strictEqual(spendRes.ok, true);
assert.strictEqual(spendRes.subAccount.spentTodayVlr, 12.5);
assert.strictEqual(spendRes.remainingTodayVlr, 17.5);
assert.strictEqual(spendRes.spendBlock.type, 'SUBACCOUNT_SPEND');
assert.strictEqual(spendRes.spendBlock.signatureValid, true);
assert.strictEqual(spendRes.receiveBlock.type, 'RECEIVE');
assert.strictEqual(spendRes.receiveBlock.signatureValid, true);

// Verify exact balance deduction from parent treasury and credit to recipient
const subBakeryAccAfter = nodeReloaded.resolveAccount('@test_bakery');
const subSprigAccAfter = nodeReloaded.resolveAccount('@sprig');
assert.strictEqual(subBakeryAccAfter.balanceVael, subBakeryBalBefore - Math.round(12.5 * 1_000_000));
assert.strictEqual(subSprigAccAfter.balanceVael, subSprigBalBefore + Math.round(12.5 * 1_000_000));

// 4. Over-limit spend rejection (12.5 + 20.0 = 32.5 > 30.0 daily cap)
assert.throws(() => {
  nodeReloaded.spendFromSubAccount({
    subAccountId: createSubRes.subAccount.id,
    recipient: '@sprig',
    amount: 20.0,
    memo: 'Over-limit fuel purchase'
  });
}, /Exceeds daily spending limit/, 'Spend exceeding daily cap must throw');

// 5. 1-Click Instant Freeze by parent
// 5a. Non-parent caller rejection
assert.throws(() => {
  nodeReloaded.toggleSubAccountFreeze({
    subAccountId: createSubRes.subAccount.id,
    caller: '@sprig',
    frozen: true
  });
}, /Only parent account/, 'Non-parent caller freezing must throw');

// 5b. Parent caller freezes
const freezeRes = nodeReloaded.toggleSubAccountFreeze({
  subAccountId: createSubRes.subAccount.id,
  caller: '@test_bakery',
  frozen: true
});
assert.strictEqual(freezeRes.ok, true);
assert.strictEqual(freezeRes.status, 'FROZEN');
assert.strictEqual(freezeRes.subAccount.isFrozen, true);
assert.strictEqual(freezeRes.freezeBlock.type, 'SUBACCOUNT_FREEZE');
assert.strictEqual(freezeRes.freezeBlock.signatureValid, true);

// 5c. Spends from frozen sub-account rejected even if within limit
assert.throws(() => {
  nodeReloaded.spendFromSubAccount({
    subAccountId: createSubRes.subAccount.id,
    recipient: '@sprig',
    amount: 5.0,
    memo: 'Attempted spend while frozen'
  });
}, /Sub-account.*is FROZEN/, 'Spend while frozen must throw');

// 5d. Parent unfreezes sub-account
const unfreezeRes = nodeReloaded.toggleSubAccountFreeze({
  subAccountId: createSubRes.subAccount.id,
  caller: '@test_bakery',
  frozen: false
});
assert.strictEqual(unfreezeRes.ok, true);
assert.strictEqual(unfreezeRes.status, 'ACTIVE');
assert.strictEqual(unfreezeRes.subAccount.isFrozen, false);

// 5e. Spend succeeds after unfreeze (12.5 + 5.0 = 17.5 <= 30.0 limit)
const spend2Res = nodeReloaded.spendFromSubAccount({
  subAccountId: createSubRes.subAccount.id,
  recipient: '@sprig',
  amount: 5.0,
  memo: 'Spend after unfreeze'
});
assert.strictEqual(spend2Res.ok, true);
assert.strictEqual(spend2Res.subAccount.spentTodayVlr, 17.5);
assert.strictEqual(spend2Res.remainingTodayVlr, 12.5);

// 6. Network Snapshot Integration
const snapAfterSubs = nodeReloaded.getNetworkSnapshot();
assert(Array.isArray(snapAfterSubs.subaccounts), 'Snapshot must contain subaccounts array');
assert(snapAfterSubs.totalSubAccountsCount >= 4, 'Snapshot must report totalSubAccountsCount');
assert(snapAfterSubs.activeSubAccountsCount >= 4, 'Snapshot must report activeSubAccountsCount');

// =========================================================================
// Feature #19: Privacy Shielded Transfers & Selective View-Key Auditability
// Cryptographic Pedersen Commitment Hiding (cmt_...) + Selective View Keys (vk_...)
// =========================================================================
console.log('Testing Feature 19: Privacy Shielded Transfers & Selective View-Key Auditability...');

// 1. Verify default seeded shielded transfers on boot
const seededShielded = nodeReloaded.getShieldedTransfers();
assert(Array.isArray(seededShielded), 'getShieldedTransfers must return an array');
assert(seededShielded.length >= 2, 'Must have at least 2 default seeded shielded transfers');
const seed1 = seededShielded.find((s) => s.fromHandle === '@neal' && s.toHandle === '@zoth');
assert(seed1, 'Seeded shielded transfer @neal -> @zoth must exist');
assert(seed1.commitment.startsWith('cmt_'), 'Commitment must start with cmt_');
assert(seed1.viewKey.startsWith('vk_'), 'View key must start with vk_');
assert.strictEqual(seed1.publicAmount, '🔒 SHIELDED');
assert.strictEqual(seed1.publicMemo, '🔒 Encrypted Stealth Payload');

// 2. Execute new Shielded Transfer with mathematical balance conservation
const bakeryAccBeforeShield = nodeReloaded.resolveAccount('@test_bakery');
const zothAccBeforeShield = nodeReloaded.resolveAccount('@zoth');
const bakeryBalBeforeShield = bakeryAccBeforeShield.balanceVael;
const zothBalBeforeShield = zothAccBeforeShield.balanceVael;

const shieldTransferRes = nodeReloaded.sendShieldedTransfer({
  from: '@test_bakery',
  to: '@zoth',
  amount: 40.0,
  memo: 'Confidential Recipe IP Licensing & Secret Ingredient Sourcing'
});

assert.strictEqual(shieldTransferRes.ok, true);
assert(shieldTransferRes.shieldedTransfer.id.startsWith('shld_'));
assert(shieldTransferRes.commitment.startsWith('cmt_'));
assert(shieldTransferRes.viewKey.startsWith('vk_'));
assert.strictEqual(shieldTransferRes.sendBlock.type, 'SHIELDED_SEND');
assert.strictEqual(shieldTransferRes.sendBlock.signatureValid, true);
assert.strictEqual(shieldTransferRes.sendBlock.data.publicAmount, '🔒 SHIELDED');
assert.strictEqual(shieldTransferRes.sendBlock.data.publicMemo, '🔒 Encrypted Stealth Payload');
assert.strictEqual(shieldTransferRes.sendBlock.quorumCertificate.status, 'FINALIZED_BFT');
assert.strictEqual(shieldTransferRes.receiveBlock.type, 'RECEIVE');
assert.strictEqual(shieldTransferRes.receiveBlock.signatureValid, true);

// Verify exact balance conservation
const bakeryAccAfterShield = nodeReloaded.resolveAccount('@test_bakery');
const zothAccAfterShield = nodeReloaded.resolveAccount('@zoth');
assert.strictEqual(bakeryAccAfterShield.balanceVael, bakeryBalBeforeShield - Math.round(40.0 * 1_000_000));
assert.strictEqual(zothAccAfterShield.balanceVael, zothBalBeforeShield + Math.round(40.0 * 1_000_000));

// 3. Selective Auditor View-Key Decryption & Proof Verification
// 3a. Rejection of invalid view key
assert.throws(() => {
  nodeReloaded.decryptShieldedTransfer({
    shieldedId: shieldTransferRes.shieldedTransfer.id,
    viewKey: 'vk_invalid_fraudulent_key_000'
  });
}, /Invalid auditor view key/i, 'Wrong view key must throw error');

// 3b. Successful selective decryption with valid view key
const decryptRes = nodeReloaded.decryptShieldedTransfer({
  shieldedId: shieldTransferRes.shieldedTransfer.id,
  viewKey: shieldTransferRes.viewKey
});

assert.strictEqual(decryptRes.ok, true);
assert.strictEqual(decryptRes.unlocked, true);
assert.strictEqual(decryptRes.from, '@test_bakery');
assert.strictEqual(decryptRes.to, '@zoth');
assert.strictEqual(decryptRes.amountVlr, 40.0);
assert.strictEqual(decryptRes.memo, 'Confidential Recipe IP Licensing & Secret Ingredient Sourcing');
assert.strictEqual(decryptRes.commitmentVerified, true);
assert.strictEqual(decryptRes.commitment, shieldTransferRes.commitment);

// 4. Network Snapshot Shielded Metrics
const snapAfterShield = nodeReloaded.getNetworkSnapshot();
assert(Array.isArray(snapAfterShield.shieldedTransfers), 'Snapshot must contain shieldedTransfers array');
assert(snapAfterShield.totalShieldedCount >= 3, 'Snapshot must report totalShieldedCount >= 3');
assert(snapAfterShield.totalShieldedVolumeVlr >= 365.0, 'Snapshot must report totalShieldedVolumeVlr >= 365');

// =========================================================================
// Feature #20: Social Group Tabs & Automatic Bill Splitting
// Instant peer-to-peer bill splitting with mathematical exactness & auto-settle
// =========================================================================
console.log('Testing Feature 20: Social Group Tabs & Automatic Bill Splitting...');

// 1. Verify default seeded group tabs on boot
const seededTabs = nodeReloaded.getGroupTabs();
assert(Array.isArray(seededTabs), 'getGroupTabs must return an array');
assert(seededTabs.length >= 2, 'Must have at least 2 default seeded group tabs');

const dinnerTab = seededTabs.find((t) => t.id === 'tab_dinner_sprig_c01');
assert(dinnerTab, 'tab_dinner_sprig_c01 must exist');
assert.strictEqual(dinnerTab.status, 'OPEN');
assert.strictEqual(dinnerTab.organizer, '@neal');
assert.strictEqual(dinnerTab.merchant, '@sprig');
assert.strictEqual(dinnerTab.totalAmountVlr, 90.0);
assert.strictEqual(dinnerTab.totalParticipants, 3);
assert.strictEqual(dinnerTab.paidCount, 2);
assert.strictEqual(dinnerTab.paidAmountVlr, 60.0);
assert.strictEqual(dinnerTab.remainingAmountVlr, 30.0);

const coopTab = seededTabs.find((t) => t.id === 'tab_coop_office_c02');
assert(coopTab, 'tab_coop_office_c02 must exist');
assert.strictEqual(coopTab.status, 'SETTLED');
assert.strictEqual(coopTab.totalAmountVlr, 120.0);
assert.strictEqual(coopTab.paidCount, 3);
assert.strictEqual(coopTab.remainingAmountVlr, 0.0);

// 2. Create new group tab with integer vael splitting
const nealAccBeforeTab = nodeReloaded.resolveAccount('@neal');
const nealBalBeforeTab = nealAccBeforeTab.balanceVael;

// Tab for 60.0 VLR split across 3 participants: @neal (organizer), @citizen, @test_bakery
const createTabRes = nodeReloaded.createGroupTab({
  organizer: '@neal',
  merchant: '@sprig',
  title: 'Organic Team Lunch & Coffee Catchup',
  totalAmount: 60.0,
  participantHandles: ['@neal', '@citizen', '@test_bakery'],
  cashbackBps: 250 // 2.5%
});

assert.strictEqual(createTabRes.ok, true);
assert(createTabRes.tab.id.startsWith('tab_'));
assert.strictEqual(createTabRes.tab.totalAmountVlr, 60.0);
assert.strictEqual(createTabRes.tab.participants.length, 3);
assert.strictEqual(createTabRes.tab.status, 'OPEN');
assert.strictEqual(createTabRes.createBlock.type, 'GROUP_TAB_CREATE');
assert.strictEqual(createTabRes.createBlock.signatureValid, true);
assert(createTabRes.createBlock.quorumCertificate, 'GROUP_TAB_CREATE must have quorum certificate');

// Check that organizer share (20.0 VLR) was deducted immediately upon creation
const nealAccAfterTab = nodeReloaded.resolveAccount('@neal');
assert.strictEqual(nealAccAfterTab.balanceVael, nealBalBeforeTab - Math.round(20.0 * 1_000_000));
assert.strictEqual(createTabRes.tab.paidCount, 1);
assert.strictEqual(createTabRes.tab.paidAmountVlr, 20.0);
assert.strictEqual(createTabRes.tab.remainingAmountVlr, 40.0);

// 3. Second participant (@citizen) pays their share
const citizenAccBefore = nodeReloaded.resolveAccount('@citizen');
const citizenBalBefore = citizenAccBefore.balanceVael;

const pay1Res = nodeReloaded.payGroupTabShare({
  tabId: createTabRes.tab.id,
  payer: '@citizen'
});

assert.strictEqual(pay1Res.ok, true);
assert.strictEqual(pay1Res.autoSettled, false, 'Should not auto-settle yet (1 participant still pending)');
assert.strictEqual(pay1Res.tab.paidCount, 2);
assert.strictEqual(pay1Res.tab.status, 'OPEN');
assert.strictEqual(pay1Res.payBlock.type, 'GROUP_TAB_PAY');
assert.strictEqual(pay1Res.payBlock.signatureValid, true);

const citizenAccAfter = nodeReloaded.resolveAccount('@citizen');
assert.strictEqual(citizenAccAfter.balanceVael, citizenBalBefore - Math.round(20.0 * 1_000_000));

// 4. Duplicate payment rejection
assert.throws(() => {
  nodeReloaded.payGroupTabShare({
    tabId: createTabRes.tab.id,
    payer: '@citizen'
  });
}, /already paid/, 'Duplicate share payment must throw error');

// Non-participant payment rejection
assert.throws(() => {
  nodeReloaded.payGroupTabShare({
    tabId: createTabRes.tab.id,
    payer: '@treasury'
  });
}, /not a participant/, 'Non-participant payment must throw error');

// 5. Final participant (@test_bakery) pays their share -> triggers auto-settle to @sprig + instant cashback
const sprigAccBeforeTab = nodeReloaded.resolveAccount('@sprig');
const sprigBalBeforeTab = sprigAccBeforeTab.balanceVael;

const pay2Res = nodeReloaded.payGroupTabShare({
  tabId: createTabRes.tab.id,
  payer: '@test_bakery'
});

assert.strictEqual(pay2Res.ok, true);
assert.strictEqual(pay2Res.autoSettled, true, 'Final payment must trigger auto-settle');
assert.strictEqual(pay2Res.tab.status, 'SETTLED');
assert.strictEqual(pay2Res.tab.paidCount, 3);
assert.strictEqual(pay2Res.tab.remainingAmountVlr, 0.0);
assert(pay2Res.tab.settleBlockHash, 'Settle block hash must be recorded');
assert(pay2Res.settleBlock, 'Settle block must exist');
assert.strictEqual(pay2Res.settleBlock.type, 'GROUP_TAB_SETTLE');
assert.strictEqual(pay2Res.settleBlock.signatureValid, true);
assert(pay2Res.cashbackBlocks.length > 0, 'Instant pro-rata cashback blocks must be emitted');

// Merchant balance must be credited full tab total (60.0 VLR)
const sprigAccAfterTab = nodeReloaded.resolveAccount('@sprig');
assert.strictEqual(sprigAccAfterTab.balanceVael, sprigBalBeforeTab + Math.round(60.0 * 1_000_000));

// Attempting to pay an already settled tab must fail
assert.throws(() => {
  nodeReloaded.payGroupTabShare({
    tabId: createTabRes.tab.id,
    payer: '@neal'
  });
}, /already settled/, 'Paying already settled tab must fail');

// 6. Network Snapshot Group Tab Metrics
const snapAfterTabs = nodeReloaded.getNetworkSnapshot();
assert(Array.isArray(snapAfterTabs.groupTabs), 'Snapshot must contain groupTabs array');
assert(snapAfterTabs.totalGroupTabsCount >= 3, 'Snapshot must report totalGroupTabsCount >= 3');
assert(snapAfterTabs.openGroupTabsCount >= 1, 'Snapshot must report openGroupTabsCount >= 1');
assert(snapAfterTabs.settledGroupTabsCount >= 2, 'Snapshot must report settledGroupTabsCount >= 2');

// =========================================================================
// Feature #21: Sovereign Inheritance & Dead-Man's Switch Continuity Vaults
// Non-custodial succession planning protecting crypto from permanent loss
// =========================================================================
console.log("Testing Feature 21: Sovereign Inheritance & Dead-Man's Switch Continuity Vaults...");

// 1. Verify default seeded inheritance plans on boot
const seededPlans = nodeReloaded.getInheritancePlans();
assert(Array.isArray(seededPlans), 'getInheritancePlans must return an array');
assert(seededPlans.length >= 2, 'Must have at least 2 default seeded inheritance plans');

const nealPlan = seededPlans.find((p) => p.owner === '@neal');
assert(nealPlan, 'Seeded plan for @neal must exist');
assert.strictEqual(nealPlan.status, 'ACTIVE');
assert.strictEqual(nealPlan.inactivityDays, 180);
assert.strictEqual(nealPlan.beneficiaries.length, 2);
assert.strictEqual(nealPlan.beneficiaries[0].handle, '@zoth');
assert.strictEqual(nealPlan.beneficiaries[0].bps, 6000);
assert.strictEqual(nealPlan.beneficiaries[1].handle, '@citizen');
assert.strictEqual(nealPlan.beneficiaries[1].bps, 4000);
assert(nealPlan.remainingDays > 0, 'Should have positive remaining days');

// 2. Configure new inheritance plan for @test_bakery
// Total must equal exactly 10,000 bps (100%)
assert.throws(() => {
  nodeReloaded.configureInheritancePlan({
    owner: '@test_bakery',
    beneficiaries: [
      { handle: '@sprig', bps: 5000 },
      { handle: '@zoth', bps: 4000 } // only 9000 bps
    ],
    inactivityDays: 90
  });
}, /must sum to exactly 10,000 bps/, 'Beneficiaries not summing to 100% must throw error');

// Owner designating themselves as beneficiary must be rejected
assert.throws(() => {
  nodeReloaded.configureInheritancePlan({
    owner: '@test_bakery',
    beneficiaries: [
      { handle: '@test_bakery', bps: 10000 }
    ],
    inactivityDays: 90
  });
}, /Owner cannot be designated as their own beneficiary/, 'Owner as beneficiary must throw error');

// Valid inheritance plan configuration
const bakeryBalBeforePlan = nodeReloaded.resolveAccount('@test_bakery').balanceVael;

const configPlanRes = nodeReloaded.configureInheritancePlan({
  owner: '@test_bakery',
  beneficiaries: [
    { handle: '@sprig', bps: 7000 },   // 70%
    { handle: '@citizen', bps: 3000 }  // 30%
  ],
  inactivityDays: 90,
  memo: 'Test Bakery Sovereign Continuity Contingency'
});

assert.strictEqual(configPlanRes.ok, true);
assert(configPlanRes.plan.id.startsWith('inh_'));
assert.strictEqual(configPlanRes.plan.owner, '@test_bakery');
assert.strictEqual(configPlanRes.plan.status, 'ACTIVE');
assert.strictEqual(configPlanRes.plan.inactivityDays, 90);
assert.strictEqual(configPlanRes.setBlock.type, 'INHERITANCE_SET');
assert.strictEqual(configPlanRes.setBlock.signatureValid, true);
assert(configPlanRes.setBlock.quorumCertificate, 'INHERITANCE_SET must have BFT quorum certificate');

// Crucial: 100% liquid balance conservation while active (non-custodial!)
const bakeryBalAfterPlan = nodeReloaded.resolveAccount('@test_bakery').balanceVael;
assert.strictEqual(bakeryBalAfterPlan, bakeryBalBeforePlan, 'Owner balance must remain 100% liquid and unencumbered while active');

// 3. Heartbeat liveness ping
const heartbeatRes = nodeReloaded.pingInheritanceHeartbeat({
  planId: configPlanRes.plan.id,
  caller: '@test_bakery'
});

assert.strictEqual(heartbeatRes.ok, true);
assert.strictEqual(heartbeatRes.heartbeatBlock.type, 'INHERITANCE_HEARTBEAT');
assert.strictEqual(heartbeatRes.heartbeatBlock.signatureValid, true);
assert(heartbeatRes.heartbeatBlock.quorumCertificate, 'INHERITANCE_HEARTBEAT must have BFT quorum certificate');

// Non-owner unauthorized heartbeat rejection
assert.throws(() => {
  nodeReloaded.pingInheritanceHeartbeat({
    planId: configPlanRes.plan.id,
    caller: '@sprig'
  });
}, /Only plan owner/, 'Unauthorized heartbeat caller must throw error');

// 4. Premature claim rejection while owner is active
assert.throws(() => {
  nodeReloaded.claimInheritancePlan({
    planId: configPlanRes.plan.id,
    caller: '@sprig',
    simulateExpired: false
  });
}, /Owner is still active — inactivity window has not elapsed/, 'Premature claim while active must throw error');

// 5. Expiry execution & atomic pro-rata distribution to beneficiaries
const sprigBalBeforeClaim = nodeReloaded.resolveAccount('@sprig').balanceVael;
const citizenBalBeforeClaim = nodeReloaded.resolveAccount('@citizen').balanceVael;
const bakeryBalToDistribute = nodeReloaded.resolveAccount('@test_bakery').balanceVael;
assert(bakeryBalToDistribute > 0, 'Test bakery must have positive balance to distribute');

const claimPlanRes = nodeReloaded.claimInheritancePlan({
  planId: configPlanRes.plan.id,
  caller: '@sprig',
  simulateExpired: true
});

assert.strictEqual(claimPlanRes.ok, true);
assert.strictEqual(claimPlanRes.plan.status, 'CLAIMED');
assert.strictEqual(claimPlanRes.claimBlock.type, 'INHERITANCE_CLAIM');
assert.strictEqual(claimPlanRes.claimBlock.signatureValid, true);
assert(claimPlanRes.claimBlock.quorumCertificate, 'INHERITANCE_CLAIM must have BFT quorum certificate');
assert.strictEqual(claimPlanRes.receiveBlocks.length, 2);

// Check exact integer vael balance conservation:
// @sprig gets 70%, @citizen gets 30%
const sprigExpectedVael = Math.floor((bakeryBalToDistribute * 7000) / 10000);
const citizenExpectedVael = bakeryBalToDistribute - sprigExpectedVael;

const sprigBalAfterClaim = nodeReloaded.resolveAccount('@sprig').balanceVael;
const citizenBalAfterClaim = nodeReloaded.resolveAccount('@citizen').balanceVael;
const bakeryBalAfterClaim = nodeReloaded.resolveAccount('@test_bakery').balanceVael;

assert.strictEqual(bakeryBalAfterClaim, 0, 'Owner estate liquid balance must be swept to beneficiaries');
assert.strictEqual(sprigBalAfterClaim, sprigBalBeforeClaim + sprigExpectedVael, 'Beneficiary 1 must receive exact 70% share');
assert.strictEqual(citizenBalAfterClaim, citizenBalBeforeClaim + citizenExpectedVael, 'Beneficiary 2 must receive exact 30% share');

// Attempting to claim an already claimed plan must fail
assert.throws(() => {
  nodeReloaded.claimInheritancePlan({
    planId: configPlanRes.plan.id,
    caller: '@sprig',
    simulateExpired: true
  });
}, /already been claimed/, 'Claiming already claimed plan must throw error');

// 6. Network Snapshot Inheritance Metrics
const snapAfterInh = nodeReloaded.getNetworkSnapshot();
assert(Array.isArray(snapAfterInh.inheritancePlans), 'Snapshot must contain inheritancePlans array');
assert(snapAfterInh.totalInheritancePlansCount >= 3, 'Snapshot must report totalInheritancePlansCount >= 3');
assert(snapAfterInh.activeInheritancePlansCount >= 2, 'Snapshot must report activeInheritancePlansCount >= 2');
assert(snapAfterInh.claimedInheritancePlansCount >= 1, 'Snapshot must report claimedInheritancePlansCount >= 1');

// ==========================================
// FEATURE 22: Reputation & Stake-Backed 0% APR Grace-Period Credit Lines & BNPL Checkout
// ==========================================
console.log('Testing Feature 22: Reputation & Stake-Backed 0% APR Credit Lines & BNPL...');

// 1. Credit Profile & Underwriting Verification
const citizenProfile = nodeReloaded.getCreditProfile('@citizen');
assert(citizenProfile, 'Citizen credit profile must exist');
assert(citizenProfile.creditScore >= 680 && citizenProfile.creditScore <= 850, 'Credit score must fall within 680–850');
assert(citizenProfile.creditLimitVlr >= 500.0, 'Credit limit must be at least the 500.0 VLR base trust floor');
assert.strictEqual(citizenProfile.gracePeriodDays, 30, 'Grace period must be exactly 30 days');
assert.strictEqual(citizenProfile.aprPct, 0.0, 'APR must be strictly 0.00%');
assert(citizenProfile.availableCreditVlr > 0, 'Available credit must be positive');
assert(citizenProfile.underwritingBreakdown.baseTrustFloorVlr === 500.0, 'Base trust floor must be 500 VLR');

// 2. Draw Credit Line with BNPL Instant Merchant Settlement
const sprigBalBeforeCreditBnpl = nodeReloaded.resolveAccount('@sprig').balanceVael;
const citizenDrawnBefore = citizenProfile.drawnCreditVlr;
const drawAmountVlr = 85.0;

const drawRes = nodeReloaded.drawCredit({
  handle: '@citizen',
  amount: drawAmountVlr,
  recipient: '@sprig',
  memo: 'Sprig Kitchen Farm-to-Table Espresso Subscription & Weekly Sourdough (BNPL)'
});

assert.strictEqual(drawRes.ok, true);
assert.strictEqual(drawRes.drawBlock.type, 'CREDIT_DRAW');
assert.strictEqual(drawRes.drawBlock.signatureValid, true);
assert(drawRes.drawBlock.quorumCertificate, 'CREDIT_DRAW must have 5-validator BFT quorum certificate');
assert.strictEqual(drawRes.drawBlock.data.amountVlr, drawAmountVlr);
assert.strictEqual(drawRes.drawBlock.data.isBnpl, true);
assert.strictEqual(drawRes.drawBlock.data.aprPct, 0.0);
assert(drawRes.receiveBlock, 'BNPL checkout must mint RECEIVE block for merchant');
assert.strictEqual(drawRes.receiveBlock.type, 'RECEIVE');

// Verify balances and drawn credit
const sprigBalAfterCreditBnpl = nodeReloaded.resolveAccount('@sprig').balanceVael;
assert.strictEqual(sprigBalAfterCreditBnpl, sprigBalBeforeCreditBnpl + Math.round(drawAmountVlr * 1_000_000), 'Merchant must receive credit settlement amount');

const citizenProfileAfterDraw = nodeReloaded.getCreditProfile('@citizen');
assert.strictEqual(citizenProfileAfterDraw.drawnCreditVlr, +(citizenDrawnBefore + drawAmountVlr).toFixed(4), 'Drawn credit must reflect drawn amount');
assert(citizenProfileAfterDraw.availableCreditVlr < citizenProfile.availableCreditVlr, 'Available credit must decrease');

// 3. Reject credit draw exceeding available credit limit
assert.throws(() => {
  nodeReloaded.drawCredit({
    handle: '@citizen',
    amount: 9999999.0
  });
}, /Credit limit exceeded/, 'Exceeding credit limit must throw error');

// 4. Repay credit line & boost on-lattice credit score
const repayAmountVlr = 45.0;
const citizenLiquidBeforeRepay = nodeReloaded.resolveAccount('@citizen').balanceVael;
const citizenRepaidCountBefore = citizenProfileAfterDraw.repaidCreditCount;

const repayRes = nodeReloaded.repayCredit({
  handle: '@citizen',
  amount: repayAmountVlr
});

assert.strictEqual(repayRes.ok, true);
assert.strictEqual(repayRes.repayBlock.type, 'CREDIT_REPAY');
assert.strictEqual(repayRes.repayBlock.signatureValid, true);
assert(repayRes.repayBlock.quorumCertificate, 'CREDIT_REPAY must have 5-validator BFT quorum certificate');
assert.strictEqual(repayRes.repaidAmountVlr, repayAmountVlr);

const citizenProfileAfterRepay = nodeReloaded.getCreditProfile('@citizen');
assert.strictEqual(citizenProfileAfterRepay.drawnCreditVlr, +(citizenProfileAfterDraw.drawnCreditVlr - repayAmountVlr).toFixed(4), 'Drawn credit must decrease by repayment amount');
assert.strictEqual(citizenProfileAfterRepay.repaidCreditCount, citizenRepaidCountBefore + 1, 'Repaid count must increment');

const citizenLiquidAfterRepay = nodeReloaded.resolveAccount('@citizen').balanceVael;
assert.strictEqual(citizenLiquidAfterRepay, citizenLiquidBeforeRepay - Math.round(repayAmountVlr * 1_000_000), 'Liquid balance must be deducted for repayment');

// 5. Test repayment when no drawn credit exists
nodeReloaded.registerAccount({ handle: '@credit_clean', displayName: 'Credit Clean', initialGrantVlr: 50 });
assert.throws(() => {
  nodeReloaded.repayCredit({
    handle: '@credit_clean',
    amount: 10.0
  });
}, /no active drawn credit balance to repay/, 'Repaying zero-balance credit must throw error');

// 6. Network Snapshot Credit Metrics
const snapAfterCredit = nodeReloaded.getNetworkSnapshot();
assert(Array.isArray(snapAfterCredit.creditProfiles), 'Snapshot must contain creditProfiles array');
assert(snapAfterCredit.totalCreditLimitVlr > 0, 'Snapshot must report positive totalCreditLimitVlr');
assert(snapAfterCredit.totalCreditDrawsCount >= 1, 'Snapshot must report totalCreditDrawsCount >= 1');
assert(snapAfterCredit.totalCreditRepayCount >= 1, 'Snapshot must report totalCreditRepayCount >= 1');

// ==========================================
// FEATURE 23: Drop-In 1-Line Merchant POS SDK (VaelorPay) & Payment Infrastructure
// ==========================================
(async () => {
  console.log('Testing Feature 23: Drop-In 1-Line Merchant POS SDK (VaelorPay)...');
  const VaelorPay = require('../public/vaelor-pay.js');
  assert(VaelorPay, 'VaelorPay module must export successfully');
  assert.strictEqual(typeof VaelorPay.createPaymentUri, 'function');
  assert.strictEqual(typeof VaelorPay.parsePaymentUri, 'function');
  assert.strictEqual(typeof VaelorPay.generateQrSvg, 'function');
  assert.strictEqual(typeof VaelorPay.verifyHandle, 'function');
  assert.strictEqual(typeof VaelorPay.createSmartReceipt, 'function');
  assert.strictEqual(typeof VaelorPay.checkoutBnpl, 'function');
  assert.strictEqual(typeof VaelorPay.createStream, 'function');

  // 1. Payment URI Creation & Round-Trip Parsing
  const paymentUriObj = VaelorPay.createPaymentUri({
    to: '@sprig',
    amount: 19.5,
    memo: 'Farm-to-Table Lunch Bowl',
    protectedHours: 48,
    invoiceId: 'inv_lunch_482'
  });
  assert(paymentUriObj.uri.startsWith('vaelor://pay?'), 'Payment URI must start with vaelor://pay?');
  assert(paymentUriObj.uri.includes('to=%40sprig') || paymentUriObj.uri.includes('to=@sprig'), 'Payment URI must contain merchant');
  assert(paymentUriObj.uri.includes('amount=19.50'), 'Payment URI must format amount');
  assert(paymentUriObj.uri.includes('protected=48h'), 'Payment URI must format protection escrow window');
  assert(paymentUriObj.embedSnippet.includes('<script src='), 'Payment URI must provide 1-line HTML embed snippet');

  const parsed = VaelorPay.parsePaymentUri(paymentUriObj.uri);
  assert.strictEqual(parsed.to, '@sprig');
  assert.strictEqual(parsed.amount, 19.5);
  assert.strictEqual(parsed.memo, 'Farm-to-Table Lunch Bowl');
  assert.strictEqual(parsed.protectedHours, 48);
  assert.strictEqual(parsed.invoiceId, 'inv_lunch_482');

  // 2. Pure Vector QR Code SVG Generation
  const qrSvg = VaelorPay.generateQrSvg(paymentUriObj.uri, 220);
  assert(typeof qrSvg === 'string', 'QR output must be a string');
  assert(qrSvg.startsWith('<svg'), 'QR code must be SVG format');
  assert(qrSvg.includes('viewBox="0 0 220 220"'), 'QR code must match requested size');
  assert(qrSvg.includes('◈'), 'QR code center emblem must contain ◈');

  // 3. Handle Verification & Offline Levenshtein / Homoglyph Phishing Guard
  // Test 3a: Exact verified merchant check
  const exactCheck = await VaelorPay.verifyHandle('@sprig');
  assert.strictEqual(exactCheck.ok, true);
  assert.strictEqual(exactCheck.safe, true);
  assert.strictEqual(exactCheck.isVerified, true);
  assert.strictEqual(exactCheck.riskLevel, 'VERIFIED_SAFE');

  // Test 3b: Homoglyph typosquatting phishing attack detection
  const phishingCheck = await VaelorPay.verifyHandle('@spr1g');
  assert.strictEqual(phishingCheck.ok, true);
  assert.strictEqual(phishingCheck.safe, false);
  assert.strictEqual(phishingCheck.riskLevel, 'HIGH_LOOKALIKE_RISK');
  assert.strictEqual(phishingCheck.suggestedHandle, '@sprig');
  assert(phishingCheck.warning.includes('Lookalike handle detected'));

  // Test 3c: Typosquatting single-edit distance
  const nealTypoCheck = await VaelorPay.verifyHandle('@neall');
  assert.strictEqual(nealTypoCheck.ok, true);
  assert.strictEqual(nealTypoCheck.safe, false);
  assert.strictEqual(nealTypoCheck.riskLevel, 'HIGH_LOOKALIKE_RISK');
  assert.strictEqual(nealTypoCheck.suggestedHandle, '@neal');

  // Test 3d: Normal unknown community handle
  const unknownCheck = await VaelorPay.verifyHandle('@alice_wonderland');
  assert.strictEqual(unknownCheck.ok, true);
  assert.strictEqual(unknownCheck.safe, true);
  assert.strictEqual(unknownCheck.isVerified, false);
  assert.strictEqual(unknownCheck.riskLevel, 'UNVERIFIED_COMMUNITY');

  // 4. SDK Cryptographic Itemized Smart Receipt Minting
  const receiptRes = await VaelorPay.createSmartReceipt({
    buyer: '@citizen',
    merchant: '@sprig',
    items: [
      { name: 'Organic Matcha Latte', qty: 2, unitPrice: 6.5 },
      { name: 'Gluten-Free Almond Croissant', qty: 1, unitPrice: 7.0 }
    ],
    category: 'Food & Dining',
    warrantyDays: 90,
    memo: 'Sprig Afternoon Coffee Break'
  });
  assert.strictEqual(receiptRes.ok, true);
  assert(receiptRes.receipt.id.startsWith('rcp_'));
  assert.strictEqual(receiptRes.receipt.grossVlr, 20.0);
  assert.strictEqual(receiptRes.receipt.netVlr, 19.5);
  assert.strictEqual(receiptRes.receipt.warrantyDays, 90);
  assert.strictEqual(receiptRes.receipt.items.length, 2);

  // 5. SDK 30-Day 0% APR BNPL Checkout
  const bnplRes = await VaelorPay.checkoutBnpl({
    handle: '@citizen',
    recipient: '@sprig',
    amount: 14.5,
    memo: 'Farm-fresh groceries delivery BNPL'
  });
  assert.strictEqual(bnplRes.ok, true);
  assert.strictEqual(bnplRes.drawBlock.type, 'CREDIT_DRAW');
  assert.strictEqual(bnplRes.drawBlock.signatureValid, true);
  assert.strictEqual(bnplRes.drawBlock.data.isBnpl, true);

  // 6. SDK Real-Time Money Streaming (<20ms per-second inference meter)
  const streamRes = await VaelorPay.createStream({
    sender: '@citizen',
    recipient: '@zoth',
    totalAmount: 15.0,
    durationSeconds: 300,
    memo: 'SDK AI Inference Metering Session'
  });
  assert.strictEqual(streamRes.ok, true);
  assert(streamRes.stream.id.startsWith('strm_'));
  assert.strictEqual(streamRes.stream.status, 'ACTIVE');
  assert.strictEqual(streamRes.stream.totalAmountVlr, 15.0);

  // ==========================================
  // FEATURE 24: 10-Tool Vaelor Layer-1 MCP Server & Sovereign Terminal CLI (vaelor-cli)
  // ==========================================
  console.log('Testing Feature 24: 10-Tool Vaelor L1 MCP Server & Sovereign Terminal CLI...');
  const { VAELOR_TOOLS, executeTool, handleMcpRequest } = require('../src/mcp/vaelor_mcp');
  const { execSync } = require('child_process');

  // 1. MCP Tools Schema & Registration Verification
  assert(Array.isArray(VAELOR_TOOLS), 'VAELOR_TOOLS must be an array');
  assert(VAELOR_TOOLS.length >= 13, 'Must expose at least 13 Vaelor Layer-1 MCP tools');

  const toolNames = VAELOR_TOOLS.map((t) => t.name);
  const expectedTools = [
    'vaelor_network_status',
    'vaelor_account_balance',
    'vaelor_send_feeless',
    'vaelor_verify_handle_safety',
    'vaelor_create_smart_receipt',
    'vaelor_mine_pouw',
    'vaelor_stake_savings',
    'vaelor_draw_credit_bnpl',
    'vaelor_post_agent_bounty',
    'vaelor_send_shielded',
    'vaelor_send_creator_tip',
    'vaelor_merchant_fx_checkout',
    'vaelor_protected_escrow'
  ];
  for (const name of expectedTools) {
    assert(toolNames.includes(name), `MCP tool '${name}' must be registered`);
  }

  // 2. Execute all 10 MCP Tools directly on lattice node
  // Tool 1: vaelor_network_status
  const statusRes = executeTool(nodeReloaded, 'vaelor_network_status', {});
  assert.strictEqual(statusRes.protocol, 'Vaelor Account-Lattice L1');
  assert(statusRes.totalSupplyVlr > 0, 'Total supply must be positive');
  assert.strictEqual(statusRes.gasFee, '$0.00 Feeless Forever');
  assert.strictEqual(statusRes.consensus.bftThreshold, 4);

  // Tool 2: vaelor_account_balance
  const balRes = executeTool(nodeReloaded, 'vaelor_account_balance', { handle: '@neal' });
  assert.strictEqual(balRes.handle, '@neal');
  assert(balRes.liquidBalanceVlr !== undefined, 'Liquid balance must be defined');
  assert(balRes.stakedBalanceVlr >= 0, 'Staked balance must be non-negative');
  assert(Array.isArray(balRes.recentBlocks), 'recentBlocks must be an array');

  // Tool 3: vaelor_send_feeless
  const sendRes = executeTool(nodeReloaded, 'vaelor_send_feeless', {
    from: '@citizen',
    to: '@sprig',
    amount: 1.75,
    memo: 'MCP Micro-Transfer test'
  });
  assert.strictEqual(sendRes.ok, true);
  assert.strictEqual(sendRes.gasFeeUsd, '$0.00 Gas');
  assert.strictEqual(sendRes.finalityMs, '<20ms');
  assert.strictEqual(sendRes.quorumStatus, 'FINALIZED_BFT');

  // Tool 4: vaelor_verify_handle_safety
  const safeCheck = executeTool(nodeReloaded, 'vaelor_verify_handle_safety', { handle: '@sprig' });
  assert.strictEqual(safeCheck.ok, true);
  assert.strictEqual(safeCheck.safety.safe, true);
  assert.strictEqual(safeCheck.safety.isVerified, true);
  assert.strictEqual(safeCheck.safety.riskLevel, 'VERIFIED_SAFE');

  const phishingCheckMcp = executeTool(nodeReloaded, 'vaelor_verify_handle_safety', { handle: '@spr1g' });
  assert.strictEqual(phishingCheckMcp.ok, true);
  assert.strictEqual(phishingCheckMcp.safety.safe, false);
  assert.strictEqual(phishingCheckMcp.safety.riskLevel, 'HIGH_LOOKALIKE_RISK');
  assert.strictEqual(phishingCheckMcp.safety.suggestedHandle, '@sprig');

  // Tool 5: vaelor_create_smart_receipt
  const receiptMcp = executeTool(nodeReloaded, 'vaelor_create_smart_receipt', {
    buyer: '@citizen',
    merchant: '@sprig',
    amount: 24.5,
    items: [{ name: 'Artisan Pastry & Cold Brew', qty: 1, unitPrice: 24.5 }],
    warrantyDays: 180
  });
  assert.strictEqual(receiptMcp.ok, true);
  assert(receiptMcp.receipt.id.startsWith('rcp_'));
  assert.strictEqual(receiptMcp.receipt.warrantyDays, 180);

  // Tool 6: vaelor_mine_pouw
  const mineMcp = executeTool(nodeReloaded, 'vaelor_mine_pouw', {
    worker: '@neal',
    workType: 'SECURITY_ENTROPY_SCAN',
    taskLabel: 'Automated MCP PoUW Mining Test'
  });
  assert.strictEqual(mineMcp.ok, true);
  assert(mineMcp.mintBlock.rewardVlr > 0, 'Mining reward must be positive');
  assert(mineMcp.mintBlock.quorumCertificate, 'Mined block must have BFT quorum certificate');

  // Tool 7: vaelor_stake_savings
  const stakeMcp = executeTool(nodeReloaded, 'vaelor_stake_savings', {
    handle: '@citizen',
    amount: 10.0
  });
  assert.strictEqual(stakeMcp.ok, true);
  assert.strictEqual(stakeMcp.apyPct, 8.5);
  assert.strictEqual(stakeMcp.stakedAmountVlr, 10.0);

  // Tool 8: vaelor_draw_credit_bnpl
  const bnplMcp = executeTool(nodeReloaded, 'vaelor_draw_credit_bnpl', {
    handle: '@citizen',
    amount: 12.0,
    recipient: '@sprig',
    memo: 'MCP BNPL Checkout'
  });
  assert.strictEqual(bnplMcp.ok, true);
  assert.strictEqual(bnplMcp.drawBlock.isBnpl, true);
  assert.strictEqual(bnplMcp.drawBlock.aprPct, 0.0);

  // Tool 9: vaelor_post_agent_bounty
  const bountyMcp = executeTool(nodeReloaded, 'vaelor_post_agent_bounty', {
    creator: '@zoth',
    title: 'Autonomous AST Security Sweep via MCP',
    rewardVlr: 25.0
  });
  assert.strictEqual(bountyMcp.ok, true);
  assert(bountyMcp.bounty.id.startsWith('bty_'));

  // Tool 10: vaelor_send_shielded
  const shieldMcp = executeTool(nodeReloaded, 'vaelor_send_shielded', {
    from: '@sprig',
    to: '@zoth',
    amount: 15.0,
    memo: 'Confidential R&D Payment via MCP'
  });
  assert.strictEqual(shieldMcp.ok, true);
  assert(shieldMcp.shieldedId.startsWith('shld_'));
  assert(shieldMcp.commitment, 'Shielded transfer must output Pedersen Commitment');
  assert(shieldMcp.viewKey, 'Shielded transfer must output selective auditor view-key');

  // 3. Test MCP JSON-RPC 2.0 Protocol Handler
  // 3a. initialize
  const initRes = handleMcpRequest(nodeReloaded, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {}
  });
  assert.strictEqual(initRes.id, 1);
  assert.strictEqual(initRes.result.serverInfo.name, 'vaelor-mcp-server');

  // 3b. tools/list
  const listRes = handleMcpRequest(nodeReloaded, {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  });
  assert.strictEqual(listRes.id, 2);
  assert(listRes.result.tools.length >= 12, 'tools/list must return at least 12 registered MCP tools');

  // 3c. tools/call
  const callRes = handleMcpRequest(nodeReloaded, {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'vaelor_network_status',
      arguments: {}
    }
  });
  assert.strictEqual(callRes.id, 3);
  assert(Array.isArray(callRes.result.content));
  const parsedContent = JSON.parse(callRes.result.content[0].text);
  assert.strictEqual(parsedContent.protocol, 'Vaelor Account-Lattice L1');

  // 4. Test vaelor-cli Sovereign Terminal Commands via Child Process
  const projectDir = path.join(__dirname, '..');
  const cliBin = path.join(projectDir, 'bin', 'vaelor-cli');
  assert(fs.existsSync(cliBin), 'bin/vaelor-cli must exist');

  const execOpts = { cwd: projectDir, maxBuffer: 20 * 1024 * 1024 };

  // 4a. vaelor-cli --json status
  const cliStatusRaw = execSync(`node "${cliBin}" --offline --json status`, execOpts).toString();
  const cliStatus = JSON.parse(cliStatusRaw);
  assert.strictEqual(cliStatus.protocol, 'Vaelor Account-Lattice L1');
  assert(cliStatus.totalBlocks > 0);

  // 4b. vaelor-cli --json balance @neal
  const cliBalRaw = execSync(`node "${cliBin}" --offline --json balance @neal`, execOpts).toString();
  const cliBal = JSON.parse(cliBalRaw);
  assert.strictEqual(cliBal.account.handle, '@neal');

  // 4c. vaelor-cli --json check @spr1g
  const cliCheckRaw = execSync(`node "${cliBin}" --offline --json check @spr1g`, execOpts).toString();
  const cliCheck = JSON.parse(cliCheckRaw);
  assert.strictEqual(cliCheck.safety.riskLevel, 'HIGH_LOOKALIKE_RISK');
  assert.strictEqual(cliCheck.safety.suggestedHandle, '@sprig');

  // 4d. vaelor-cli help
  const cliHelp = execSync(`node "${cliBin}" help`, execOpts).toString();
  assert(cliHelp.includes('◈ VAELOR (VLR)'), 'CLI help must include Vaelor header');
  assert(cliHelp.includes('status'), 'CLI help must list status command');

  // =========================================================================
  // Feature 25: Instant Feeless Creator Tip Jars & Open-Source Micro-Patronage
  // =========================================================================
  console.log('\n--- Running Feature 25: Feeless Creator Tip Jars & Open-Source Patronage ---');

  // 1. Initial seeded tip jars verification
  const initialTipsZoth = nodeReloaded.getCreatorTips('@zoth');
  assert(Array.isArray(initialTipsZoth) && initialTipsZoth.length >= 1, 'Initial seeded tips for @zoth must exist');
  assert.strictEqual(initialTipsZoth[0].badge, 'SOVEREIGN_BACKER', 'Initial seed for @zoth must be SOVEREIGN_BACKER (100 VLR)');

  const initialTipsSprig = nodeReloaded.getCreatorTips('@sprig');
  assert(Array.isArray(initialTipsSprig) && initialTipsSprig.length >= 1, 'Initial seeded tips for @sprig must exist');
  assert.strictEqual(initialTipsSprig[0].badge, 'PATRON', 'Initial seed for @sprig must be PATRON (25 VLR)');

  const initialTipsHatch = nodeReloaded.getCreatorTips('@hatch');
  assert(Array.isArray(initialTipsHatch) && initialTipsHatch.length >= 1, 'Initial seeded tips for @hatch must exist');
  assert.strictEqual(initialTipsHatch[0].badge, 'PATRON', 'Initial seed for @hatch must be PATRON (50 VLR)');

  // 2. Send 100 VLR Tip -> SOVEREIGN_BACKER Badge & 2.5% Cashback Rebate
  const nealBalBeforeTip = nodeReloaded.resolveAccount('@neal').balanceVael;
  const zothBalBeforeTip = nodeReloaded.resolveAccount('@zoth').balanceVael;

  const tip100Res = nodeReloaded.sendCreatorTip({
    from: '@neal',
    creator: '@zoth',
    amount: 100.0,
    message: 'Founding Patron for Sovereign AI Compute & ZothOS DAG',
    projectSlug: 'zoth-os'
  });

  assert.strictEqual(tip100Res.ok, true);
  assert(tip100Res.tip.id.startsWith('tip_'), 'Tip ID must start with tip_');
  assert.strictEqual(tip100Res.tip.fromHandle, '@neal');
  assert.strictEqual(tip100Res.tip.creatorHandle, '@zoth');
  assert.strictEqual(tip100Res.tip.amountVlr, 100.0);
  assert.strictEqual(tip100Res.badge, 'SOVEREIGN_BACKER');
  assert.strictEqual(tip100Res.badgeEmoji, '👑');
  // @neal is high-staked SOVEREIGN_DIAMOND -> 5.00% dynamic loyalty cashback (5.0 VLR)
  assert.strictEqual(tip100Res.cashbackVlr, 5.0);
  assert.strictEqual(tip100Res.sendBlock.type, 'TIP_JAR_SEND');
  assert.strictEqual(tip100Res.sendBlock.signatureValid, true);
  assert(tip100Res.sendBlock.quorumCertificate, 'TIP_JAR_SEND must have 5-validator BFT quorum certificate');
  assert.strictEqual(tip100Res.cashbackBlock.type, 'CASHBACK_REBATE');
  assert.strictEqual(tip100Res.cashbackBlock.signatureValid, true);

  // Exact balance conservation check with 5.00% Sovereign Diamond cashback rebate:
  // Neal sent 100 VLR (-100,000,000 vael) and received 5.0 VLR (+5,000,000 vael) cashback = net -95,000,000 vael
  const nealBalAfterTip = nodeReloaded.resolveAccount('@neal').balanceVael;
  const zothBalAfterTip = nodeReloaded.resolveAccount('@zoth').balanceVael;
  assert.strictEqual(nealBalAfterTip, nealBalBeforeTip - 95_000_000, 'Sender balance must reflect net -95.0 VLR after 5.00% Sovereign Diamond cashback rebate');
  assert.strictEqual(zothBalAfterTip, zothBalBeforeTip + 100_000_000, 'Creator balance must increase by exact tip amount (+100 VLR)');

  // 3. Send 25 VLR Tip -> PATRON Tier (Citizen is GOLD tier -> 3.50% dynamic cashback = 0.875 VLR)
  const tip25Res = nodeReloaded.sendCreatorTip('@citizen', '@hatch', 25.0, 'Supporting open-source developers!', 'hatch-grants');
  assert.strictEqual(tip25Res.ok, true);
  assert.strictEqual(tip25Res.badge, 'PATRON');
  assert.strictEqual(tip25Res.badgeEmoji, '🌟');
  assert.strictEqual(tip25Res.cashbackVlr, 0.875);

  // 4. Send 5 VLR Tip -> SUPPORTER Tier (3.50% Gold cashback = 0.175 VLR)
  const tip5Res = nodeReloaded.sendCreatorTip('@citizen', '@sprig', 5.0, 'Artisan dark roast tip', 'sprig-pos');
  assert.strictEqual(tip5Res.ok, true);
  assert.strictEqual(tip5Res.badge, 'SUPPORTER');
  assert.strictEqual(tip5Res.badgeEmoji, '✨');
  assert.strictEqual(tip5Res.cashbackVlr, 0.175);

  // 5. Send 0.5 VLR Tip -> MICRO_PATRON Tier (3.50% Gold cashback = 0.0175 VLR)
  const tipMicroRes = nodeReloaded.sendCreatorTip('@citizen', '@sprig', 0.5, 'Quick espresso sip', 'sprig-pos');
  assert.strictEqual(tipMicroRes.ok, true);
  assert.strictEqual(tipMicroRes.badge, 'MICRO_PATRON');
  assert.strictEqual(tipMicroRes.badgeEmoji, '☕');
  assert.strictEqual(tipMicroRes.cashbackVlr, 0.0175);

  // 6. Test getCreatorTips helpers
  const zothTips = nodeReloaded.getCreatorTips('@zoth');
  assert(zothTips.length >= 2, '@zoth must have at least 2 tips (1 seed + 1 new)');
  assert.strictEqual(zothTips[0].badge, 'SOVEREIGN_BACKER');

  const allTips = nodeReloaded.getCreatorTips();
  assert(allTips.length >= 7, 'Global tips array must contain at least 7 tips');

  // 7. Verify Network Snapshot tip fields
  const snapWithTips = nodeReloaded.getNetworkSnapshot();
  assert(snapWithTips.totalTipsCount >= 7, 'Snapshot totalTipsCount must reflect all tips');
  assert(snapWithTips.totalTipsVolumeVlr >= 300, 'Snapshot totalTipsVolumeVlr must be positive');
  assert(Array.isArray(snapWithTips.tips), 'Snapshot tips must be an array');
  assert(typeof snapWithTips.tipJars === 'object', 'Snapshot tipJars must be an object');

  // 8. Test State Persistence across Save & Reload
  const nodeTipsReloaded = new VaelorLatticeNode(tmpFile);

  const reloadedZothTips = nodeTipsReloaded.getCreatorTips('@zoth');
  assert.strictEqual(reloadedZothTips.length, zothTips.length, 'Tip count for @zoth must match across state reload');
  assert.strictEqual(reloadedZothTips[0].badge, 'SOVEREIGN_BACKER', 'Persisted badge tier must match');
  assert(nodeTipsReloaded.tipJars && Object.keys(nodeTipsReloaded.tipJars).length > 0, 'tipJars state mapping must persist cleanly');

  // =========================================================================
  // Feature 26: Sovereign Consumer Loyalty & Dynamic Cashback Multiplier Tiers
  // =========================================================================
  console.log('\n--- Running Feature 26: Sovereign Consumer Loyalty & Multiplier Tiers ---');

  // 1. Initial Loyalty Profiles
  const profileSprig = nodeTipsReloaded.getLoyaltyProfile('@sprig');
  assert.strictEqual(profileSprig.handle, '@sprig');
  assert.strictEqual(profileSprig.tier, 'BRONZE');
  assert.strictEqual(profileSprig.cashbackBps, 250);
  assert.strictEqual(profileSprig.cashbackPct, 2.5);
  assert.strictEqual(profileSprig.badgeEmoji, '🥉');

  // Active transacting accounts evaluate to GOLD tier (3.50% cashback)
  const profileCitizen = nodeTipsReloaded.getLoyaltyProfile('@citizen');
  assert.strictEqual(profileCitizen.handle, '@citizen');
  assert.strictEqual(profileCitizen.tier, 'GOLD');
  assert.strictEqual(profileCitizen.cashbackBps, 350);
  assert.strictEqual(profileCitizen.cashbackPct, 3.5);
  assert.strictEqual(profileCitizen.badgeEmoji, '🥇');

  // High-staked accounts evaluate to SOVEREIGN_DIAMOND (5.00% cashback)
  const profileNeal = nodeTipsReloaded.getLoyaltyProfile('@neal');
  assert.strictEqual(profileNeal.handle, '@neal');
  assert.strictEqual(profileNeal.tier, 'SOVEREIGN_DIAMOND');
  assert.strictEqual(profileNeal.cashbackBps, 500);
  assert.strictEqual(profileNeal.cashbackPct, 5.0);
  assert.strictEqual(profileNeal.badgeEmoji, '💎');

  const profileZoth = nodeTipsReloaded.getLoyaltyProfile('@zoth');
  assert.strictEqual(profileZoth.tier, 'SOVEREIGN_DIAMOND');
  assert.strictEqual(profileZoth.cashbackPct, 5.0);

  // 2. Boost Loyalty Tier with Staked Collateral
  // 2a. Boost @sprig from BRONZE -> SILVER with 150 VLR stake
  const boostSprigRes = nodeTipsReloaded.boostLoyaltyTier('@sprig', 150.0);
  assert.strictEqual(boostSprigRes.ok, true);
  assert.strictEqual(boostSprigRes.handle, '@sprig');
  assert.strictEqual(boostSprigRes.previousTier, 'BRONZE');
  assert.strictEqual(boostSprigRes.newTier, 'SILVER');
  assert.strictEqual(boostSprigRes.upgraded, true);
  assert.strictEqual(boostSprigRes.cashbackPct, 3.0);
  assert.strictEqual(boostSprigRes.block.type, 'LOYALTY_BOOST');
  assert.strictEqual(boostSprigRes.block.signatureValid, true);
  assert(boostSprigRes.block.quorumCertificate, 'LOYALTY_BOOST block must have BFT quorum certificate');
  assert.strictEqual(boostSprigRes.block.quorumCertificate.status, 'FINALIZED_BFT');
  assert.strictEqual(boostSprigRes.block.quorumCertificate.approvals, 5);

  // 2b. Boost @citizen from GOLD -> SOVEREIGN_DIAMOND with needed stake boost
  const neededForDiamond = nodeTipsReloaded.getLoyaltyProfile('@citizen').remainingToNextTierVlr;
  const boostCitizenRes = nodeTipsReloaded.boostLoyaltyTier('@citizen', neededForDiamond);
  assert.strictEqual(boostCitizenRes.ok, true);
  assert.strictEqual(boostCitizenRes.handle, '@citizen');
  assert.strictEqual(boostCitizenRes.previousTier, 'GOLD');
  assert.strictEqual(boostCitizenRes.newTier, 'SOVEREIGN_DIAMOND');
  assert.strictEqual(boostCitizenRes.cashbackPct, 5.0);

  // 3. Dynamic Cashback in sendCreatorTip based on Loyalty Tier
  // @sprig is now SILVER (3.00% cashback / 300 bps)
  const sprigBalBefore = nodeTipsReloaded.resolveAccount('@sprig').balanceVael;
  const zothBalBefore = nodeTipsReloaded.resolveAccount('@zoth').balanceVael;

  const tipSilverRes = nodeTipsReloaded.sendCreatorTip({
    from: '@sprig',
    creator: '@zoth',
    amount: 20.0,
    message: 'Silver tier supporter patronage for edge node',
    projectSlug: 'zoth-os'
  });

  assert.strictEqual(tipSilverRes.ok, true);
  assert.strictEqual(tipSilverRes.loyaltyTier, 'SILVER');
  assert.strictEqual(tipSilverRes.cashbackPct, 3.0);
  assert.strictEqual(tipSilverRes.cashbackBps, 300);
  // 20.0 * 3.00% = 0.60 VLR cashback rebate
  assert.strictEqual(tipSilverRes.cashbackVlr, 0.6);

  // Balance conservation:
  // @sprig debited 20 VLR (-20,000,000 vael) + credited 0.60 VLR (+600,000 vael) = net -19,400,000 vael
  const sprigBalAfter = nodeTipsReloaded.resolveAccount('@sprig').balanceVael;
  const zothBalAfter = nodeTipsReloaded.resolveAccount('@zoth').balanceVael;
  assert.strictEqual(sprigBalAfter, sprigBalBefore - 19_400_000, 'Sprig balance must reflect net -19.4 VLR after 3.00% Silver cashback');
  assert.strictEqual(zothBalAfter, zothBalBefore + 20_000_000, 'Creator balance must increase by exact tip amount (+20 VLR)');

  // 4. Test MCP Tool #11: vaelor_send_creator_tip
  const mcpTipRes = executeTool(nodeTipsReloaded, 'vaelor_send_creator_tip', {
    from: '@sprig',
    creator: '@zoth',
    amount: 10.0,
    message: 'MCP Tool 11 micro-patronage test',
    projectSlug: 'zoth-os'
  });
  assert.strictEqual(mcpTipRes.ok, true);
  assert(mcpTipRes.tip.id.startsWith('tip_'));
  assert.strictEqual(mcpTipRes.tip.fromHandle, '@sprig');
  assert.strictEqual(mcpTipRes.tip.creatorHandle, '@zoth');
  assert.strictEqual(mcpTipRes.tip.amountVlr, 10.0);
  assert.strictEqual(mcpTipRes.badge, 'SUPPORTER');
  assert.strictEqual(mcpTipRes.loyaltyTier, 'SILVER');
  assert.strictEqual(mcpTipRes.cashbackPct, 3.0);
  assert.strictEqual(mcpTipRes.cashbackVlr, 0.3); // 10.0 * 3.00% = 0.30 VLR

  // 5. Test CLI Subcommand: vaelor-cli tip
  const cliTipRaw = execSync(`node "${cliBin}" --offline --json tip @sprig @zoth 5.0 "CLI patronage test"`, execOpts).toString();
  const cliTip = JSON.parse(cliTipRaw);
  assert.strictEqual(cliTip.ok, true);
  assert.strictEqual(cliTip.tip.fromHandle, '@sprig');
  assert.strictEqual(cliTip.tip.creatorHandle, '@zoth');
  assert.strictEqual(cliTip.tip.amountVlr, 5.0);
  assert.strictEqual(cliTip.badge, 'SUPPORTER');

  // Verify 'tip' in vaelor-cli help
  const cliHelpUpdated = execSync(`node "${cliBin}" help`, execOpts).toString();
  assert(cliHelpUpdated.includes('Feeless micro-patronage tip with dynamic cashback'), 'CLI help must include tip description');
  assert(cliHelpUpdated.replace(/\x1b\[[0-9;]*m/g, '').includes('tip <from> <creator> <amt>'), 'CLI help must include tip command syntax');

  // 6. Network Snapshot Loyalty Metadata
  const snapWithLoyalty = nodeTipsReloaded.getNetworkSnapshot();
  assert(typeof snapWithLoyalty.loyaltySummary === 'object', 'Snapshot must include loyaltySummary');
  assert.strictEqual(snapWithLoyalty.loyaltySummary.maxCashbackPct, 5.0);
  assert.strictEqual(snapWithLoyalty.loyaltySummary.baseCashbackPct, 2.5);
  assert.strictEqual(snapWithLoyalty.loyaltySummary.tiers.length, 4);

  const diamondAccounts = snapWithLoyalty.accounts.filter((a) => a.loyaltyTier === 'SOVEREIGN_DIAMOND');
  assert(diamondAccounts.length >= 2, 'Must have at least 2 Sovereign Diamond accounts (@neal, @zoth, @citizen)');
  const silverAccounts = snapWithLoyalty.accounts.filter((a) => a.loyaltyTier === 'SILVER');
  assert(silverAccounts.length >= 1, 'Must have at least 1 Silver account (@sprig)');

  // 7. State Persistence of Loyalty Boost
  const nodeLoyaltyReloaded = new VaelorLatticeNode(tmpFile);
  const reloadedSprigProfile = nodeLoyaltyReloaded.getLoyaltyProfile('@sprig');
  assert.strictEqual(reloadedSprigProfile.tier, 'SILVER', 'Loyalty tier must persist as SILVER across state reloads');
  assert.strictEqual(reloadedSprigProfile.cashbackPct, 3.0);
  const reloadedCitizenProfile = nodeLoyaltyReloaded.getLoyaltyProfile('@citizen');
  assert.strictEqual(reloadedCitizenProfile.tier, 'SOVEREIGN_DIAMOND', 'Citizen tier must persist as SOVEREIGN_DIAMOND');

  // =========================================================================
  // Feature 27: Programmable Merchant FX Auto-Conversion & Treasury Sweep
  // =========================================================================
  console.log('\n--- Running Feature 27: Programmable Merchant FX Auto-Conversion ---');

  // 1. Initial Seeded Merchant FX Rules
  const sprigRule = nodeLoyaltyReloaded.getMerchantFxRule('@sprig');
  assert.strictEqual(sprigRule.merchant, '@sprig');
  assert.strictEqual(sprigRule.usdPct, 70);
  assert.strictEqual(sprigRule.vaultStakePct, 20);
  assert.strictEqual(sprigRule.liquidVlrPct, 10);

  const zothRule = nodeLoyaltyReloaded.getMerchantFxRule('@zoth');
  assert.strictEqual(zothRule.usdPct, 40);
  assert.strictEqual(zothRule.vaultStakePct, 40);
  assert.strictEqual(zothRule.liquidVlrPct, 20);

  const hatchRule = nodeLoyaltyReloaded.getMerchantFxRule('@hatch');
  assert.strictEqual(hatchRule.usdPct, 50);
  assert.strictEqual(hatchRule.vaultStakePct, 30);
  assert.strictEqual(hatchRule.liquidVlrPct, 20);

  // 2. Configure Custom Merchant FX Rule
  // Rejection guard: split must total 100%
  assert.throws(() => {
    nodeLoyaltyReloaded.configureMerchantFxRule('@sprig', { usdPct: 50, vaultStakePct: 20, liquidVlrPct: 10 });
  }, /must total exactly 100%/);

  const configRes = nodeLoyaltyReloaded.configureMerchantFxRule('@sprig', { usdPct: 60, vaultStakePct: 30, liquidVlrPct: 10 });
  assert.strictEqual(configRes.ok, true);
  assert.strictEqual(configRes.rule.usdPct, 60);
  assert.strictEqual(configRes.rule.vaultStakePct, 30);
  assert.strictEqual(configRes.rule.liquidVlrPct, 10);

  // 3. Execute Merchant FX Checkout
  // @citizen pays @sprig 100 VLR with 60% USD / 30% Vault / 10% Liquid VLR split
  const sprigBalBeforeFx = nodeLoyaltyReloaded.resolveAccount('@sprig').balanceVael;
  const sprigStakedBeforeFx = nodeLoyaltyReloaded.resolveAccount('@sprig').stakedBalanceVael || 0;
  const sprigUsdBeforeFx = nodeLoyaltyReloaded.resolveAccount('@sprig').usdReserveBalance || 0;
  const citizenBalBeforeFx = nodeLoyaltyReloaded.resolveAccount('@citizen').balanceVael;

  const checkoutRes = nodeLoyaltyReloaded.executeMerchantFxCheckout('@citizen', '@sprig', 100.0, 'Organic Espresso Roast & Pastries Batch');
  assert.strictEqual(checkoutRes.ok, true);
  assert.strictEqual(checkoutRes.buyer, '@citizen');
  assert.strictEqual(checkoutRes.merchant, '@sprig');
  assert.strictEqual(checkoutRes.amountVlr, 100.0);
  assert.strictEqual(checkoutRes.fxSplit.usdPct, 60);
  assert.strictEqual(checkoutRes.fxSplit.vaultStakePct, 30);
  assert.strictEqual(checkoutRes.fxSplit.liquidVlrPct, 10);
  assert.strictEqual(checkoutRes.fxSplit.usdAmount, 60.0);
  assert.strictEqual(checkoutRes.fxSplit.vaultStakeVlr, 30.0);
  assert.strictEqual(checkoutRes.fxSplit.liquidVlr, 10.0);
  assert.strictEqual(checkoutRes.fxSplit.fxSpreadPct, 0.0);

  // Buyer earns dynamic loyalty cashback (Citizen is Sovereign Diamond -> 5.00% = 5.0 VLR)
  assert.strictEqual(checkoutRes.cashback.cashbackVlr, 5.0);
  assert.strictEqual(checkoutRes.cashback.cashbackPct, 5.0);
  assert.strictEqual(checkoutRes.cashback.loyaltyTier, 'SOVEREIGN_DIAMOND');

  // Verify BFT-certified MERCHANT_FX_SETTLE block
  assert.strictEqual(checkoutRes.fxBlock.type, 'MERCHANT_FX_SETTLE');
  assert.strictEqual(checkoutRes.fxBlock.signatureValid, true);
  assert(checkoutRes.fxBlock.quorumCertificate, 'MERCHANT_FX_SETTLE must have 5-validator BFT quorum certificate');
  assert.strictEqual(checkoutRes.fxBlock.quorumCertificate.status, 'FINALIZED_BFT');
  assert.strictEqual(checkoutRes.fxBlock.quorumCertificate.approvals, 5);

  // Verify exact merchant balance updates:
  // USD reserve increased by 60.0 USD
  const sprigAfter = nodeLoyaltyReloaded.resolveAccount('@sprig');
  assert.strictEqual(sprigAfter.usdReserveBalance, +(sprigUsdBeforeFx + 60.0).toFixed(4));
  // Vault stake increased by 30 VLR (30,000,000 vael)
  assert.strictEqual(sprigAfter.stakedBalanceVael, sprigStakedBeforeFx + 30_000_000);
  // Liquid balance increased by 10 VLR (10,000,000 vael)
  assert.strictEqual(sprigAfter.balanceVael, sprigBalBeforeFx + 10_000_000);

  // Buyer net balance: -100 VLR (-100,000,000 vael) + 5.0 VLR (+5,000,000 vael) cashback = net -95,000,000 vael
  const citizenAfter = nodeLoyaltyReloaded.resolveAccount('@citizen');
  assert.strictEqual(citizenAfter.balanceVael, citizenBalBeforeFx - 95_000_000);

  // 4. Test MCP Tool #12: vaelor_merchant_fx_checkout
  const mcpFxRes = executeTool(nodeLoyaltyReloaded, 'vaelor_merchant_fx_checkout', {
    buyer: '@citizen',
    merchant: '@zoth',
    amount: 50.0,
    memo: 'AI compute cluster subscription checkout'
  });
  assert.strictEqual(mcpFxRes.ok, true);
  assert.strictEqual(mcpFxRes.buyer, '@citizen');
  assert.strictEqual(mcpFxRes.merchant, '@zoth');
  assert.strictEqual(mcpFxRes.amountVlr, 50.0);
  // @zoth rule: 40% USD ($20) / 40% Vault (20 ◈) / 20% Liquid (10 ◈)
  assert.strictEqual(mcpFxRes.fxSplit.usdAmount, 20.0);
  assert.strictEqual(mcpFxRes.fxSplit.vaultStakeVlr, 20.0);
  assert.strictEqual(mcpFxRes.fxSplit.liquidVlr, 10.0);

  // 4b. Second checkout to @sprig to test multiple settlements history
  const checkout2 = nodeLoyaltyReloaded.executeMerchantFxCheckout('@citizen', '@sprig', 25.0, 'Second Espresso Catering');
  assert.strictEqual(checkout2.ok, true);

  // 5. Test CLI Subcommand: vaelor-cli fx
  const cliFxRaw = execSync(`node "${cliBin}" --offline --json fx @citizen @sprig 20.0 "CLI merchant checkout test"`, execOpts).toString();
  const cliFx = JSON.parse(cliFxRaw);
  assert.strictEqual(cliFx.ok, true);
  assert.strictEqual(cliFx.buyer, '@citizen');
  assert.strictEqual(cliFx.merchant, '@sprig');
  assert.strictEqual(cliFx.amountVlr, 20.0);
  assert.strictEqual(cliFx.fxSplit.usdAmount, 14.0); // Default genesis rule for @sprig: 70% of 20 = 14
  assert.strictEqual(cliFx.fxSplit.vaultStakeVlr, 4.0); // 20% of 20 = 4
  assert.strictEqual(cliFx.fxSplit.liquidVlr, 2.0); // 10% of 20 = 2

  // Verify 'fx' in vaelor-cli help
  const cliHelpFx = execSync(`node "${cliBin}" help`, execOpts).toString();
  assert(cliHelpFx.includes('Multi-currency merchant FX auto-split checkout'), 'CLI help must include fx command description');

  // 6. Network Snapshot Integration
  const snapWithFx = nodeLoyaltyReloaded.getNetworkSnapshot();
  assert(Array.isArray(snapWithFx.merchantFxRules), 'Snapshot must include merchantFxRules array');
  assert(snapWithFx.merchantFxRules.length >= 3, 'Must have at least 3 merchant FX rules');
  assert(Array.isArray(snapWithFx.merchantFxSettlements), 'Snapshot must include merchantFxSettlements array');
  assert(snapWithFx.totalFxSettlementsCount >= 3, 'totalFxSettlementsCount must reflect executed checkouts');

  // 7. State Persistence across Save & Reload
  const nodeFxReloaded = new VaelorLatticeNode(tmpFile);
  const reloadedSprigRule = nodeFxReloaded.getMerchantFxRule('@sprig');
  assert.strictEqual(reloadedSprigRule.usdPct, 60, 'Persisted rule usdPct must match');
  assert.strictEqual(reloadedSprigRule.vaultStakePct, 30, 'Persisted rule vaultStakePct must match');
  const reloadedSettlements = nodeFxReloaded.getMerchantFxSettlements('@sprig');
  assert(reloadedSettlements.length >= 2, 'Settlement history for @sprig must persist across reload');

  // ==========================================
  // FEATURE 28: Zero-Penalty Protected Commerce Escrow & Instant Split-Resolution
  // ==========================================
  console.log('\n--- Running Feature 28: Zero-Penalty Protected Commerce Escrow & Instant Split-Resolution ---');

  // Fund @citizen with 500 VLR from @neal for testing
  nodeFxReloaded.transfer({ from: '@neal', to: '@citizen', amountVlr: 500.0, memo: 'Fund @citizen for protected escrow testing' });

  // 1. Create Protected Escrow (Positional and Object Arguments)
  const pe1 = nodeFxReloaded.createProtectedEscrow('@citizen', '@sprig', 50.0, 'Hardware Order #1', 72);
  assert.strictEqual(pe1.ok, true);
  assert.strictEqual(pe1.buyer, '@citizen');
  assert.strictEqual(pe1.merchant, '@sprig');
  assert.strictEqual(pe1.amountVlr, 50.0);
  assert.strictEqual(pe1.itemTitle, 'Hardware Order #1');
  assert.strictEqual(pe1.autoReleaseHours, 72);
  assert.strictEqual(pe1.status, 'LOCKED');
  assert.strictEqual(pe1.block.type, 'ESCROW_CREATE');
  assert.strictEqual(pe1.block.signatureValid, true);
  assert.strictEqual(pe1.block.quorumCertificate.status, 'FINALIZED_BFT');
  assert.strictEqual(pe1.block.quorumCertificate.approvals, 5);

  const pe2 = nodeFxReloaded.createProtectedEscrow({
    buyer: '@citizen',
    merchant: '@zoth',
    amountVlr: 60.0,
    itemTitle: 'Edge Server 1U Compute Cluster',
    autoReleaseHours: 48
  });
  assert.strictEqual(pe2.ok, true);
  assert.strictEqual(pe2.status, 'LOCKED');

  const pe3 = nodeFxReloaded.createProtectedEscrow('@citizen', '@sprig', 40.0, 'Artisan Espresso Catering Batch', 72);
  assert.strictEqual(pe3.ok, true);
  assert.strictEqual(pe3.status, 'LOCKED');

  // 2. Resolve Protected Escrow with RELEASE (100% to merchant + dynamic loyalty cashback)
  const citBalBeforeRel = nodeFxReloaded.resolveAccount('@citizen').balanceVael;
  const sprigBalBeforeRel = nodeFxReloaded.resolveAccount('@sprig').balanceVael;

  const relRes = nodeFxReloaded.resolveProtectedEscrow(pe1.escrowId, 'RELEASE');
  assert.strictEqual(relRes.ok, true);
  assert.strictEqual(relRes.resolutionType, 'RELEASE');
  assert.strictEqual(relRes.status, 'RELEASED');
  assert.strictEqual(relRes.merchantAmountVlr, 50.0);
  assert.strictEqual(relRes.buyerRefundVlr, 0);

  // Merchant received 100% of 50.0 VLR ($0 fee)
  const sprigBalAfterRel = nodeFxReloaded.resolveAccount('@sprig').balanceVael;
  assert.strictEqual(sprigBalAfterRel, sprigBalBeforeRel + 50_000_000);

  // Buyer earned dynamic loyalty cashback (Citizen is Sovereign Diamond 5.0% -> 2.5 VLR)
  assert.strictEqual(relRes.cashbackVlr, 2.5);
  const citBalAfterRel = nodeFxReloaded.resolveAccount('@citizen').balanceVael;
  assert.strictEqual(citBalAfterRel, citBalBeforeRel + 2_500_000);

  // Attested with 5-validator BFT quorum
  assert.strictEqual(relRes.block.type, 'ESCROW_RESOLVE');
  assert.strictEqual(relRes.block.quorumCertificate.approvals, 5);

  // 3. Resolve Protected Escrow with REFUND (100% to buyer with $0 merchant penalty)
  const citBalBeforeRef = nodeFxReloaded.resolveAccount('@citizen').balanceVael;
  const zothBalBeforeRef = nodeFxReloaded.resolveAccount('@zoth').balanceVael;

  const refRes = nodeFxReloaded.resolveProtectedEscrow(pe2.escrowId, 'REFUND');
  assert.strictEqual(refRes.ok, true);
  assert.strictEqual(refRes.resolutionType, 'REFUND');
  assert.strictEqual(refRes.status, 'REFUNDED');
  assert.strictEqual(refRes.buyerRefundVlr, 60.0);
  assert.strictEqual(refRes.merchantAmountVlr, 0);

  // Buyer balance restored
  const citBalAfterRef = nodeFxReloaded.resolveAccount('@citizen').balanceVael;
  assert.strictEqual(citBalAfterRef, citBalBeforeRef + 60_000_000);

  // Merchant charged $0 chargeback penalty
  const zothBalAfterRef = nodeFxReloaded.resolveAccount('@zoth').balanceVael;
  assert.strictEqual(zothBalAfterRef, zothBalBeforeRef);
  assert.strictEqual(refRes.block.data.chargebackPenaltyUsd, 0);
  assert.strictEqual(refRes.block.quorumCertificate.approvals, 5);

  // 4. Resolve Protected Escrow with SPLIT (50/50 fair resolution in <20ms with $0 dispute fee)
  const citBalBeforeSplit = nodeFxReloaded.resolveAccount('@citizen').balanceVael;
  const sprigBalBeforeSplit = nodeFxReloaded.resolveAccount('@sprig').balanceVael;

  const splitRes = nodeFxReloaded.resolveProtectedEscrow(pe3.escrowId, 'SPLIT', 50);
  assert.strictEqual(splitRes.ok, true);
  assert.strictEqual(splitRes.resolutionType, 'SPLIT');
  assert.strictEqual(splitRes.status, 'SPLIT_SETTLED');
  assert.strictEqual(splitRes.refundPct, 50);
  assert.strictEqual(splitRes.buyerRefundVlr, 20.0);
  assert.strictEqual(splitRes.merchantAmountVlr, 20.0);

  // Buyer got 20 VLR refund + dynamic cashback on merchant's 20 VLR portion (5% of 20 = 1.0 VLR)
  const citBalAfterSplit = nodeFxReloaded.resolveAccount('@citizen').balanceVael;
  assert.strictEqual(citBalAfterSplit, citBalBeforeSplit + 20_000_000 + 1_000_000);

  // Merchant received 20.0 VLR
  const sprigBalAfterSplit = nodeFxReloaded.resolveAccount('@sprig').balanceVael;
  assert.strictEqual(sprigBalAfterSplit, sprigBalBeforeSplit + 20_000_000);
  assert.strictEqual(splitRes.block.data.disputeFeeUsd, 0);
  assert.strictEqual(splitRes.block.quorumCertificate.approvals, 5);

  // 5. Test MCP Tool #13: vaelor_protected_escrow
  const mcpEscCreate = executeTool(nodeFxReloaded, 'vaelor_protected_escrow', {
    action: 'create',
    buyer: '@citizen',
    merchant: '@sprig',
    amount: 30.0,
    itemTitle: 'MCP Hardware Prototype Order',
    autoReleaseHours: 72
  });
  assert.strictEqual(mcpEscCreate.ok, true);
  assert.strictEqual(mcpEscCreate.action, 'create');
  assert.strictEqual(mcpEscCreate.amountVlr, 30.0);

  const mcpEscRel = executeTool(nodeFxReloaded, 'vaelor_protected_escrow', {
    action: 'release',
    escrowId: mcpEscCreate.escrowId
  });
  assert.strictEqual(mcpEscRel.ok, true);
  assert.strictEqual(mcpEscRel.resolutionType, 'RELEASE');
  assert.strictEqual(mcpEscRel.merchantAmountVlr, 30.0);
  assert(mcpEscRel.cashbackVlr > 0, 'MCP release must disburse buyer loyalty cashback');

  // 6. Test CLI Subcommand: vaelor-cli escrow
  const cliEscRaw = execSync(`node "${cliBin}" --offline --json escrow create @citizen @sprig 15.0 "CLI protected order" 72`, execOpts).toString();
  const cliEsc = JSON.parse(cliEscRaw);
  assert.strictEqual(cliEsc.ok, true);
  assert.strictEqual(cliEsc.amountVlr, 15.0);

  const cliSplitRaw = execSync(`node "${cliBin}" --offline --json escrow split ${cliEsc.escrowId} 50`, execOpts).toString();
  const cliSplit = JSON.parse(cliSplitRaw);
  assert.strictEqual(cliSplit.ok, true);
  assert.strictEqual(cliSplit.status, 'SPLIT_SETTLED');
  assert.strictEqual(cliSplit.buyerRefundVlr, 7.5);

  const cliHelpEsc = execSync(`node "${cliBin}" help`, execOpts).toString().replace(/\x1b\[[0-9;]*m/g, '');
  assert(cliHelpEsc.includes('escrow <create|release|refund|split|list>'), 'CLI help must include escrow command');

  // 7. State Persistence across Save & Reload
  const nodeEscrowReloaded = new VaelorLatticeNode(tmpFile);
  const reloadedEscrows = nodeEscrowReloaded.getProtectedEscrows();
  assert(reloadedEscrows.length >= 3, 'Must persist protected escrows across state reload');
  const reloadedPe1 = nodeEscrowReloaded.getProtectedEscrow(pe1.escrowId);
  assert.strictEqual(reloadedPe1.status, 'RELEASED', 'Settled escrow status must persist');

  // ==========================================
  // FEATURE 29: 28-Feature Drop-In Merchant SDK (VaelorPay) & High-Throughput DAG Stress Benchmark
  // ==========================================
  console.log('\n--- Running Feature 29: VaelorPay 28-Feature SDK & High-Throughput DAG Stress Benchmark ---');

  // 1. Verify VaelorPay SDK Drop-In Client Methods with in-memory local lattice node
  VaelorPay.setLocalNode(nodeEscrowReloaded);

  // Fund test participants for SDK and benchmark runs
  const benchmarkParticipants = ['@zoth', '@sprig', '@hatch', '@citizen', '@neal'];
  for (const handle of benchmarkParticipants) {
    nodeEscrowReloaded.transfer({ from: '@treasury', to: handle, amountVlr: 5000.0, memo: 'Pre-fund benchmark participant' });
  }

  // 1a. VaelorPay.getLoyaltyProfile
  const sdkLoyalty = await VaelorPay.getLoyaltyProfile('@citizen');
  assert.strictEqual(sdkLoyalty.ok, true, 'getLoyaltyProfile must return ok: true');
  assert(sdkLoyalty.profile, 'getLoyaltyProfile must return profile object');
  assert(typeof sdkLoyalty.profile.tier === 'string', 'Loyalty tier must be a string');
  assert(typeof sdkLoyalty.profile.cashbackBps === 'number', 'Loyalty cashbackBps must be a number');
  assert(typeof sdkLoyalty.profile.cashbackPct === 'number', 'Loyalty cashbackPct must be a number');

  // 1b. VaelorPay.sendCreatorTip
  const sdkTip = await VaelorPay.sendCreatorTip({
    from: '@citizen',
    creator: '@zoth',
    amountVlr: 15.0,
    message: 'Wave 22 SDK Patronage tip for autonomous DAG engine',
    projectSlug: 'zoth-os'
  });
  assert.strictEqual(sdkTip.ok, true, 'sendCreatorTip must return ok: true');
  assert(sdkTip.tip.id.startsWith('tip_'), 'Tip ID must start with tip_');
  assert.strictEqual(sdkTip.tip.amountVlr, 15.0);
  assert.strictEqual(sdkTip.sendBlock.type, 'TIP_JAR_SEND');
  assert.strictEqual(sdkTip.sendBlock.signatureValid, true);
  assert.strictEqual(sdkTip.sendBlock.quorumCertificate.approvals, 5);
  assert(sdkTip.cashbackBlock, 'Creator tip must emit dynamic loyalty cashback block');
  assert.strictEqual(sdkTip.cashbackBlock.type, 'CASHBACK_REBATE');

  // 1c. VaelorPay.checkoutMerchantFx
  const sdkFx = await VaelorPay.checkoutMerchantFx({
    buyer: '@citizen',
    merchant: '@sprig',
    amountVlr: 20.0,
    memo: 'Wave 22 SDK Merchant FX Checkout (Artisan Lunch Bowl)'
  });
  assert.strictEqual(sdkFx.ok, true, 'checkoutMerchantFx must return ok: true');
  assert.strictEqual(sdkFx.buyer, '@citizen');
  assert.strictEqual(sdkFx.merchant, '@sprig');
  assert.strictEqual(sdkFx.amountVlr, 20.0);
  assert(sdkFx.fxSplit.usdAmount > 0, 'FX checkout must allocate USD portion');
  assert(sdkFx.fxSplit.vaultStakeVlr > 0, 'FX checkout must allocate vault portion');
  assert(sdkFx.fxSplit.liquidVlr > 0, 'FX checkout must allocate liquid VLR portion');
  assert.strictEqual(sdkFx.fxBlock.type, 'MERCHANT_FX_SETTLE');
  assert.strictEqual(sdkFx.fxBlock.signatureValid, true);
  assert.strictEqual(sdkFx.fxBlock.quorumCertificate.status, 'FINALIZED_BFT');
  assert.strictEqual(sdkFx.fxBlock.quorumCertificate.approvals, 5);

  // 1d. VaelorPay.createProtectedEscrow
  const sdkEscrow = await VaelorPay.createProtectedEscrow({
    buyer: '@citizen',
    merchant: '@hatch',
    amountVlr: 25.0,
    itemTitle: 'Wave 22 SDK Hardware Order #4821',
    autoReleaseHours: 48
  });
  assert.strictEqual(sdkEscrow.ok, true, 'createProtectedEscrow must return ok: true');
  assert(sdkEscrow.escrowId.startsWith('esc_'), 'Escrow ID must start with esc_');
  assert.strictEqual(sdkEscrow.status, 'LOCKED');
  assert.strictEqual(sdkEscrow.amountVlr, 25.0);
  assert.strictEqual(sdkEscrow.block.type, 'ESCROW_CREATE');
  assert.strictEqual(sdkEscrow.block.signatureValid, true);
  assert.strictEqual(sdkEscrow.block.quorumCertificate.approvals, 5);

  // 1e. VaelorPay.resolveProtectedEscrow
  const sdkEscrowResolve = await VaelorPay.resolveProtectedEscrow({
    escrowId: sdkEscrow.escrowId,
    resolutionType: 'RELEASE'
  });
  assert.strictEqual(sdkEscrowResolve.ok, true, 'resolveProtectedEscrow must return ok: true');
  assert.strictEqual(sdkEscrowResolve.resolutionType, 'RELEASE');
  assert.strictEqual(sdkEscrowResolve.status, 'RELEASED');
  assert.strictEqual(sdkEscrowResolve.merchantAmountVlr, 25.0);
  assert.strictEqual(sdkEscrowResolve.buyerRefundVlr, 0);
  assert(sdkEscrowResolve.cashbackVlr > 0, 'Buyer must receive dynamic loyalty cashback rebate');
  assert.strictEqual(sdkEscrowResolve.block.type, 'ESCROW_RESOLVE');
  assert.strictEqual(sdkEscrowResolve.block.signatureValid, true);
  assert.strictEqual(sdkEscrowResolve.block.quorumCertificate.approvals, 5);

  // 1f. VaelorPay.callMcpTool
  const sdkMcpStatus = await VaelorPay.callMcpTool('vaelor_network_status', {});
  assert.strictEqual(sdkMcpStatus.ok, true, 'callMcpTool must return ok: true');
  assert.strictEqual(sdkMcpStatus.tool, 'vaelor_network_status');
  assert.strictEqual(sdkMcpStatus.result.protocol, 'Vaelor Account-Lattice L1');
  assert.strictEqual(sdkMcpStatus.result.consensus.bftThreshold, 4);

  const sdkMcpBal = await VaelorPay.callMcpTool('vaelor_account_balance', { handle: '@neal' });
  assert.strictEqual(sdkMcpBal.ok, true);
  assert.strictEqual(sdkMcpBal.result.handle, '@neal');
  assert(sdkMcpBal.result.liquidBalanceVlr > 0);

  // 2. High-Throughput Multi-Account DAG Stress Benchmark (50 rapid operations)
  console.log('Executing 50-operation multi-account DAG stress benchmark across 5 accounts...');
  const stressBlocks = [];
  let totalFinalityMs = 0;
  let totalQuorumLatencyMs = 0;

  // Track balance conservation for feeless transfer slice (20 operations)
  let preTransferTotalVael = 0;
  for (const h of benchmarkParticipants) {
    preTransferTotalVael += nodeEscrowReloaded.resolveAccount(h).balanceVael;
  }

  // Slice 1: 20 rapid feeless transfers
  for (let i = 0; i < 20; i++) {
    const from = benchmarkParticipants[i % benchmarkParticipants.length];
    const to = benchmarkParticipants[(i + 1) % benchmarkParticipants.length];
    const amount = 10.0 + (i * 0.5);
    const tx = nodeEscrowReloaded.transfer({ from, to, amountVlr: amount, memo: `Stress Feeless Transfer #${i + 1}` });
    stressBlocks.push(tx.sendBlock, tx.receiveBlock);
  }

  let postTransferTotalVael = 0;
  for (const h of benchmarkParticipants) {
    postTransferTotalVael += nodeEscrowReloaded.resolveAccount(h).balanceVael;
  }
  // Invariant 1: Exact mathematical integer balance conservation across pure feeless transfers
  assert.strictEqual(
    postTransferTotalVael,
    preTransferTotalVael,
    `Exact feeless transfer balance conservation must be 100% (before: ${preTransferTotalVael}, after: ${postTransferTotalVael})`
  );

  // Slice 2: 15 rapid Merchant FX Settlements
  const merchants = ['@sprig', '@zoth', '@hatch'];
  for (let i = 0; i < 15; i++) {
    const buyer = benchmarkParticipants[i % benchmarkParticipants.length];
    const merchant = merchants[i % merchants.length];
    const amount = 12.0 + i;
    const fxRes = nodeEscrowReloaded.executeMerchantFxCheckout(buyer, merchant, amount, `Stress Merchant FX #${i + 1}`);
    stressBlocks.push(fxRes.fxBlock);
  }

  // Slice 3: 15 rapid Zero-Penalty Protected Escrows (Create + Resolve with alternating RELEASE / SPLIT)
  for (let i = 0; i < 15; i++) {
    const buyer = benchmarkParticipants[i % benchmarkParticipants.length];
    const merchant = benchmarkParticipants[(i + 2) % benchmarkParticipants.length];
    const amount = 15.0 + i;
    const createRes = nodeEscrowReloaded.createProtectedEscrow(buyer, merchant, amount, `Stress Escrow #${i + 1}`, 48);
    stressBlocks.push(createRes.block);

    const isRelease = (i % 2 === 0);
    const relRes = nodeEscrowReloaded.resolveProtectedEscrow(
      createRes.escrowId,
      isRelease ? 'RELEASE' : 'SPLIT',
      isRelease ? 0 : 50
    );
    stressBlocks.push(relRes.block);
  }

  // 3. Cryptographic Invariants & Benchmark Metrics Verification
  assert.strictEqual(stressBlocks.length, 85, '50 stress operations must mint exactly 85 BFT-attested blocks');

  for (const b of stressBlocks) {
    assert.strictEqual(b.signatureValid, true, 'Block Ed25519 micro-work signature must be cryptographically valid');
    assert(b.quorumCertificate, 'Block must include BFT Quorum Certificate');
    assert.strictEqual(b.quorumCertificate.status, 'FINALIZED_BFT', 'Block must achieve FINALIZED_BFT status');
    assert.strictEqual(b.quorumCertificate.approvals, 5, 'Block must achieve 5/5 validator quorum approvals');
    assert.strictEqual(b.quorumCertificate.validatorSignatures.length, 5, 'Must contain 5 distinct validator signatures');

    totalFinalityMs += (b.finalityMs || 0);
    totalQuorumLatencyMs += (b.quorumCertificate.aggregateLatencyMs || 0);
  }

  const avgFinalityMs = totalFinalityMs / stressBlocks.length;
  const avgQuorumLatencyMs = totalQuorumLatencyMs / stressBlocks.length;

  console.log(`Stress Benchmark Results:`);
  console.log(`  - Total Blocks Attested: ${stressBlocks.length}`);
  console.log(`  - Average Block Finality: ${avgFinalityMs.toFixed(2)} ms (SLA requirement: < 20.0 ms)`);
  console.log(`  - Average BFT Quorum Latency: ${avgQuorumLatencyMs.toFixed(2)} ms (SLA requirement: < 20.0 ms)`);
  console.log(`  - Quorum Approval Rate: 100% (5/5 validators on every single block)`);
  console.log(`  - Feeless Transfer Balance Conservation: 100.000000% exact atomic integer precision`);

  assert(avgFinalityMs < 20.0, `Average block finality (${avgFinalityMs.toFixed(2)}ms) must be strictly < 20ms`);
  assert(avgQuorumLatencyMs < 20.0, `Average BFT quorum latency (${avgQuorumLatencyMs.toFixed(2)}ms) must be strictly < 20ms`);

  // 4. State Persistence Verification for Benchmark State
  const nodeBenchReloaded = new VaelorLatticeNode(tmpFile);
  const snapFinal = nodeBenchReloaded.getNetworkSnapshot();
  assert(snapFinal.totalBlocks > 100, 'Snapshot must contain all blocks from stress test');
  assert(snapFinal.escrows.length >= 18, 'Snapshot must track all created protected escrows');
  assert(snapFinal.totalFxSettlementsCount >= 18, 'Snapshot must track all merchant FX checkouts');

  // ==========================================
  // FEATURE 30: Sovereign 1-Click CPA Tax & Cashback Audit Exporter (IRS-Compliant)
  // ==========================================
  console.log('\n--- Running Feature 30: Sovereign 1-Click CPA Tax & Cashback Audit Exporter ---');

  // 1. Direct Node Verification
  const taxReportCitizen = nodeBenchReloaded.getTaxReport('@citizen', 2026);
  assert.strictEqual(taxReportCitizen.ok, true, 'getTaxReport must return ok: true');
  assert.strictEqual(taxReportCitizen.account.handle, '@citizen');
  assert.strictEqual(taxReportCitizen.taxYear, 2026);
  assert(taxReportCitizen.summary, 'Tax report must contain summary object');
  assert(taxReportCitizen.summary.taxFreeCashbackRebatesVlr > 0, 'Must record positive non-taxable loyalty cashback rebates (IRS Rev. Rul. 76-96)');
  assert(taxReportCitizen.summary.deductibleCommerceAndBountiesVlr > 0, 'Must record deductible commerce expenses');
  assert(Array.isArray(taxReportCitizen.records) && taxReportCitizen.records.length > 0, 'Must contain ledger transaction records');
  assert.strictEqual(typeof taxReportCitizen.auditDigest, 'string');
  assert.strictEqual(taxReportCitizen.auditDigest.length, 64, 'Audit digest must be a 64-char SHA-256 hash');
  assert(taxReportCitizen.csvReport.includes('# VAELOR (◈ VLR) SOVEREIGN CPA TAX & CASHBACK AUDIT REPORT'), 'CSV must include metadata header');
  assert(taxReportCitizen.csvReport.includes('IRS Rev. Rul. 76-96'), 'CSV metadata must cite IRS Rev. Rul. 76-96');
  assert(taxReportCitizen.csvReport.includes('Date,Timestamp,Block Hash,Type,Tax Category,Classification'), 'CSV must contain RFC-4180 column headers');

  // 2. Multi-Account Support (Merchant @sprig & Creator @zoth)
  const taxReportSprig = nodeBenchReloaded.getTaxReport('@sprig', 2026);
  assert.strictEqual(taxReportSprig.ok, true);
  assert.strictEqual(taxReportSprig.account.handle, '@sprig');
  assert(taxReportSprig.records.length > 0);

  const taxReportZoth = nodeBenchReloaded.getTaxReport('@zoth', 2026);
  assert.strictEqual(taxReportZoth.ok, true);
  assert.strictEqual(taxReportZoth.account.handle, '@zoth');

  // 3. MCP Tool #14 Verification (vaelor_export_tax_report)
  const mcpTaxJson = executeTool(nodeBenchReloaded, 'vaelor_export_tax_report', {
    handle: '@citizen',
    taxYear: 2026,
    format: 'json'
  });
  assert.strictEqual(mcpTaxJson.ok, true, 'MCP Tool 14 JSON export must succeed');
  assert.strictEqual(mcpTaxJson.account.handle, '@citizen');
  assert(mcpTaxJson.summary.taxFreeCashbackRebatesVlr > 0);
  assert.strictEqual(mcpTaxJson.auditDigest.length, 64);

  const mcpTaxCsv = executeTool(nodeBenchReloaded, 'vaelor_export_tax_report', {
    handle: '@citizen',
    taxYear: 2026,
    format: 'csv'
  });
  assert.strictEqual(mcpTaxCsv.ok, true, 'MCP Tool 14 CSV export must succeed');
  assert.strictEqual(mcpTaxCsv.format, 'csv');
  assert(mcpTaxCsv.csvReport.startsWith('# VAELOR (◈ VLR) SOVEREIGN CPA TAX & CASHBACK AUDIT REPORT'));

  // 4. Drop-In SDK Verification (VaelorPay.getTaxReport)
  VaelorPay.setLocalNode(nodeBenchReloaded);
  const sdkTax = await VaelorPay.getTaxReport('@citizen', { taxYear: 2026 });
  assert.strictEqual(sdkTax.ok, true, 'VaelorPay.getTaxReport must succeed');
  assert.strictEqual(sdkTax.account.handle, '@citizen');
  assert.strictEqual(sdkTax.auditDigest.length, 64);

  const sdkTaxCsv = await VaelorPay.getTaxReport('@citizen', { taxYear: 2026, format: 'csv' });
  assert.strictEqual(sdkTaxCsv.ok, true);
  assert.strictEqual(sdkTaxCsv.format, 'csv');
  assert(sdkTaxCsv.csvReport.includes('IRS Rev. Rul. 76-96'));

  // 5. CLI Subcommand: vaelor-cli tax
  const cliTaxRaw = execSync(`node "${cliBin}" --offline --json tax @citizen 2026`, execOpts).toString();
  const cliTax = JSON.parse(cliTaxRaw);
  assert.strictEqual(cliTax.ok, true, 'vaelor-cli tax --json must output valid JSON');
  assert.strictEqual(cliTax.account.handle, '@citizen');
  assert(cliTax.summary.taxFreeCashbackRebatesVlr > 0);

  const cliTaxCsv = execSync(`node "${cliBin}" --offline tax @citizen 2026 --csv`, execOpts).toString();
  assert(cliTaxCsv.includes('# VAELOR (◈ VLR) SOVEREIGN CPA TAX & CASHBACK AUDIT REPORT'), 'vaelor-cli tax --csv must output CSV report');
  assert(cliTaxCsv.includes('PURCHASE_CASHBACK_REBATE'), 'CSV must contain categorized cashback rows');

  // Verify 'tax' in vaelor-cli help
  const cliHelpTax = execSync(`node "${cliBin}" help`, execOpts).toString();
  assert(cliHelpTax.includes('tax'), 'CLI help must include tax command');
  assert(cliHelpTax.includes('CPA tax & cashback audit report'), 'CLI help must describe CPA tax report');

  // ==========================================
  // FEATURE 31: ZothOS Sovereign Passphrase-Gated P2P Messenger (COMM_HANDSHAKE & COMM_MESSAGE)
  // ==========================================
  console.log('\n--- Running Feature 31: ZothOS Sovereign Passphrase-Gated P2P Messenger & 24/7 AI Dispatcher ---');

  // 1. Direct Node Verification & Peer Discovery
  const commPeers = nodeBenchReloaded.getCommPeers();
  assert(Array.isArray(commPeers), 'getCommPeers must return an array');
  assert(commPeers.length >= 4, 'Must register default ZothOS fleet peers');
  const handles = commPeers.map(p => p.handle);
  assert(handles.includes('@zoth'), 'Must contain @zoth peer');
  assert(handles.includes('@zoth-rig2'), 'Must contain @zoth-rig2 peer');
  assert(handles.includes('@neal'), 'Must contain @neal peer');
  assert(handles.includes('@citizen'), 'Must contain @citizen peer');

  // 2. Identity Registration & Cryptographic Verifier Derivation
  const testReg = nodeBenchReloaded.registerCommIdentity('@comm_node_alpha', 'alpha-vault-key-757', {
    nodeName: 'ZothOS Alpha Test Node',
    lanEndpoint: 'http://192.168.1.105:8140'
  });
  assert.strictEqual(testReg.ok, true, 'registerCommIdentity must succeed');
  assert.strictEqual(testReg.identity.handle, '@comm_node_alpha');
  const storedId = nodeBenchReloaded.state.commIdentities['@comm_node_alpha'];
  assert(storedId, 'Stored identity must exist in lattice state');
  assert.strictEqual(typeof storedId.commSalt, 'string');
  assert.strictEqual(typeof storedId.commVerifierHash, 'string');
  assert.strictEqual(storedId.commVerifierHash.length, 64, 'Verifier must be a 64-char SHA-256 hash');

  // Also register account on lattice so it can receive blocks and transfers
  nodeBenchReloaded.registerAccount({ handle: '@comm_node_alpha', displayName: 'Alpha Node', initialGrantVlr: 100 });

  // 3. Cryptographic Handshake Authorization
  // Invalid passphrase must throw error
  assert.throws(() => {
    nodeBenchReloaded.requestCommHandshake('@neal', '@comm_node_alpha', 'wrong-passphrase', 'Test handshake');
  }, /Invalid ZothOS Comm credentials: username or passphrase rejected/, 'Invalid passphrase must reject handshake');

  // Valid passphrase establishes authorized channel with 5/5 BFT consensus
  const handshakeRes = nodeBenchReloaded.requestCommHandshake(
    '@neal',
    '@comm_node_alpha',
    'alpha-vault-key-757',
    'Establish ZothOS P2P Autonomous Channel'
  );
  assert.strictEqual(handshakeRes.ok, true, 'Valid handshake must succeed');
  assert(handshakeRes.channelId.startsWith('chn_'), 'Channel ID must start with chn_');
  assert.strictEqual(handshakeRes.handshakeBlock.type, 'COMM_HANDSHAKE');
  assert.strictEqual(handshakeRes.handshakeBlock.signatureValid, true);
  assert.strictEqual(handshakeRes.handshakeBlock.quorumCertificate.status, 'FINALIZED_BFT');
  assert.strictEqual(handshakeRes.handshakeBlock.quorumCertificate.approvals, 5);

  // 4. AES-256-GCM Encrypted Message & Feeless Attached VLR Transfer
  const nealBalBeforeComm = nodeBenchReloaded.resolveAccount('@neal').balanceVael;
  const alphaBalBeforeComm = nodeBenchReloaded.resolveAccount('@comm_node_alpha').balanceVael;

  const commMsgRes = nodeBenchReloaded.sendCommMessage({
    from: '@neal',
    to: '@comm_node_alpha',
    passphrase: 'alpha-vault-key-757',
    message: 'Deploy autonomous 24/7 AST parser service to ZothOS Alpha Node.',
    attachedVlr: 15.0,
    aiTaskPrompt: 'Start AST parser daemon on port 8094.'
  });

  assert.strictEqual(commMsgRes.ok, true, 'sendCommMessage must succeed');
  assert(commMsgRes.messageId.startsWith('msg_'), 'Message ID must start with msg_');
  assert.strictEqual(commMsgRes.algorithm, 'AES-256-GCM');
  assert.strictEqual(typeof commMsgRes.ciphertextHex, 'string');
  assert.strictEqual(typeof commMsgRes.ivHex, 'string');
  assert.strictEqual(typeof commMsgRes.authTagHex, 'string');
  assert.strictEqual(commMsgRes.attachedVlr, 15.0);
  assert.strictEqual(commMsgRes.quorumCertificate.approvals, 5);

  // Check balance transfer
  const nealBalAfterComm = nodeBenchReloaded.resolveAccount('@neal').balanceVael;
  const alphaBalAfterComm = nodeBenchReloaded.resolveAccount('@comm_node_alpha').balanceVael;
  assert.strictEqual(nealBalAfterComm, nealBalBeforeComm - 15_000_000, 'Sender balance must decrease by attached VLR');
  assert.strictEqual(alphaBalAfterComm, alphaBalBeforeComm + 15_000_000, 'Recipient balance must increase by attached VLR');

  // 5. Decrypted Inbox Verification
  // Invalid passphrase rejected
  assert.throws(() => {
    nodeBenchReloaded.readCommInbox('@comm_node_alpha', 'bad-pass');
  }, /Invalid ZothOS Comm credentials: username or passphrase rejected/);

  // Valid passphrase returns decrypted plaintext and AI prompt
  const alphaInbox = nodeBenchReloaded.readCommInbox('@comm_node_alpha', 'alpha-vault-key-757');
  assert.strictEqual(alphaInbox.ok, true);
  assert(Array.isArray(alphaInbox.messages));
  assert(alphaInbox.messages.length >= 1);
  const receivedMsg = alphaInbox.messages[0];
  assert.strictEqual(receivedMsg.from, '@neal');
  assert.strictEqual(receivedMsg.to, '@comm_node_alpha');
  assert.strictEqual(receivedMsg.message, 'Deploy autonomous 24/7 AST parser service to ZothOS Alpha Node.');
  assert.strictEqual(receivedMsg.aiTaskPrompt, 'Start AST parser daemon on port 8094.');
  assert.strictEqual(receivedMsg.attachedVlr, 15.0);

  // 6. Pre-seeded Messages (@neal <-> @zoth-rig2)
  const rig2Inbox = nodeBenchReloaded.readCommInbox('@zoth-rig2', 'zoth-sovereign-757');
  assert.strictEqual(rig2Inbox.ok, true);
  assert(rig2Inbox.messages.length >= 2, 'Pre-seeded messages between @neal and @zoth-rig2 must exist');
  assert(rig2Inbox.messages.some(m => m.aiTaskPrompt.includes('autonomous AST linting')));

  // 7. MCP Tool #15 Verification (vaelor_zoth_comm)
  // 7a. Query peers
  const mcpCommPeers = executeTool(nodeBenchReloaded, 'vaelor_zoth_comm', { action: 'peers' });
  assert.strictEqual(mcpCommPeers.ok, true);
  assert(mcpCommPeers.peers.length >= 4);

  // 7b. Rejected on invalid passphrase
  const mcpBadPass = executeTool(nodeBenchReloaded, 'vaelor_zoth_comm', {
    to: '@zoth-rig2',
    passphrase: 'wrong-passphrase',
    message: 'Testing rejected comm'
  });
  assert.strictEqual(mcpBadPass.ok, false);
  assert.strictEqual(mcpBadPass.handshakeValid, false);
  assert.strictEqual(mcpBadPass.status, 'REJECTED_UNAUTHORIZED_HANDSHAKE');

  // 7c. Valid message dispatch
  const mcpGoodSend = executeTool(nodeBenchReloaded, 'vaelor_zoth_comm', {
    from: '@neal',
    to: '@zoth-rig2',
    passphrase: 'zoth-sovereign-757',
    message: 'Dispatching Wave 24 Autonomous Agent Verification',
    amountVlr: 5.0,
    aiPrompt: 'Run 31 test suites across triple-viewports'
  });
  assert.strictEqual(mcpGoodSend.ok, true);
  assert.strictEqual(mcpGoodSend.handshakeValid, true);
  assert.strictEqual(mcpGoodSend.status, 'DELIVERED_AND_DECRYPTED');
  assert.strictEqual(mcpGoodSend.encryption.algorithm, 'AES-256-GCM');
  assert.strictEqual(mcpGoodSend.quorumCertificate.approvals, 5);
  assert(mcpGoodSend.aiFleetDispatch);
  assert.strictEqual(mcpGoodSend.aiFleetDispatch.prompt, 'Run 31 test suites across triple-viewports');

  // 7d. Read inbox via MCP Tool #15
  const mcpInbox = executeTool(nodeBenchReloaded, 'vaelor_zoth_comm', {
    action: 'inbox',
    handle: '@zoth-rig2',
    passphrase: 'zoth-sovereign-757'
  });
  assert.strictEqual(mcpInbox.ok, true);
  assert(mcpInbox.messages.length >= 3);

  // 8. Drop-In SDK Verification (VaelorPay Comm Methods)
  const sdkCommPeers = await VaelorPay.getCommPeers();
  assert.strictEqual(sdkCommPeers.ok, true);
  assert(sdkCommPeers.peers.length >= 4);

  const sdkCommSend = await VaelorPay.sendCommMessage({
    from: '@neal',
    to: '@zoth-rig2',
    passphrase: 'zoth-sovereign-757',
    message: 'Wave 24 SDK Comm Verification',
    attachedVlr: 2.0,
    aiTaskPrompt: 'Audit 31 test suites'
  });
  assert.strictEqual(sdkCommSend.ok, true);
  assert.strictEqual(sdkCommSend.algorithm, 'AES-256-GCM');

  const sdkCommInbox = await VaelorPay.readCommInbox('@zoth-rig2', 'zoth-sovereign-757');
  assert.strictEqual(sdkCommInbox.ok, true);
  assert(sdkCommInbox.messages.length >= 4);

  // 9. CLI Subcommands: vaelor-cli comm
  // 9a. vaelor-cli comm peers
  const cliCommPeersRaw = execSync(`node "${cliBin}" --offline --json comm peers`, execOpts).toString();
  const cliCommPeers = JSON.parse(cliCommPeersRaw);
  assert.strictEqual(cliCommPeers.ok, true);
  assert(cliCommPeers.peers.length >= 4);

  // 9b. vaelor-cli comm inbox
  const cliCommInboxRaw = execSync(`node "${cliBin}" --offline --json comm inbox @zoth-rig2 zoth-sovereign-757`, execOpts).toString();
  const cliCommInbox = JSON.parse(cliCommInboxRaw);
  assert.strictEqual(cliCommInbox.ok, true);
  assert(cliCommInbox.messages.length >= 2);

  // 9c. vaelor-cli comm send
  const cliCommSendRaw = execSync(`node "${cliBin}" --offline --json comm send @neal @zoth-rig2 zoth-sovereign-757 "CLI comm test message" 1.0 "Verify CLI prompt"`, execOpts).toString();
  const cliCommSend = JSON.parse(cliCommSendRaw);
  assert.strictEqual(cliCommSend.ok, true);
  assert.strictEqual(cliCommSend.algorithm, 'AES-256-GCM');

  const cliCommInboxAfterRaw = execSync(`node "${cliBin}" --offline --json comm inbox @zoth-rig2 zoth-sovereign-757`, execOpts).toString();
  const cliCommInboxAfter = JSON.parse(cliCommInboxAfterRaw);
  assert.strictEqual(cliCommInboxAfter.ok, true);
  assert(cliCommInboxAfter.messages.length >= 3);

  // 9d. CLI help check for comm
  const cliHelpComm = execSync(`node "${cliBin}" help`, execOpts).toString();
  assert(cliHelpComm.includes('comm'), 'CLI help must include comm command');
  assert(cliHelpComm.includes('ZothOS passphrase-gated P2P encrypted messenger'), 'CLI help must describe comm');

  // =========================================================================
  // Feature 32: Enterprise Institutional Core — Merkle State Root, Append-Only WAL & P2P Cluster
  // =========================================================================
  console.log('Testing Feature #32: Enterprise Genesis-to-Head Merkle State Root, Append-Only WAL & P2P Cluster Mesh...');

  // 1. computeMerkleStateRoot()
  const merkleResult = nodeReloaded.computeMerkleStateRoot();
  assert.strictEqual(typeof merkleResult.merkleRoot, 'string');
  assert.strictEqual(merkleResult.merkleRoot.length, 64, 'Merkle state root must be SHA-256 hex 64 chars');
  assert(merkleResult.leafCount >= 4, 'Must have at least 4 account leaves');
  assert(merkleResult.treeDepth >= 2, 'Tree depth must be >= 2');

  // Determinism check: computing again without state change must yield identical root
  const merkleResult2 = nodeReloaded.computeMerkleStateRoot();
  assert.strictEqual(merkleResult.merkleRoot, merkleResult2.merkleRoot, 'Merkle state root must be 100% deterministic');

  // 2. Append-Only WAL verification
  assert(nodeReloaded.walFile, 'Node must define walFile path');
  assert(fs.existsSync(nodeReloaded.walFile), 'Append-only WAL file vaelor_blocks.wal.jsonl must exist on disk');
  const walContent = fs.readFileSync(nodeReloaded.walFile, 'utf8').trim();
  const walLines = walContent.split('\n').filter(Boolean);
  assert(walLines.length >= 10, 'WAL file must contain serialized JSONL blocks');
  const firstWalBlock = JSON.parse(walLines[0]);
  assert(firstWalBlock.hash, 'WAL lines must be valid blocks with block hash');

  // 3. verifyFullChainIntegrity()
  const integrityResult = nodeReloaded.verifyFullChainIntegrity();
  assert.strictEqual(integrityResult.ok, true);
  assert.strictEqual(integrityResult.status, 'ENTERPRISE_VERIFIED');
  assert.strictEqual(integrityResult.merkleStateRoot, merkleResult.merkleRoot);
  assert(integrityResult.totalBlocksVerified >= 10);
  assert(integrityResult.bftQuorumVerifiedCount >= 5);
  assert.strictEqual(typeof integrityResult.totalCirculatingVlr, 'number');
  assert(integrityResult.auditDurationMs >= 0);

  // 4. P2P Peer Registry & Cluster Delta
  const p2pPeers = nodeReloaded.getP2pPeers();
  assert(p2pPeers.length >= 6, 'Must have at least 6 seeded P2P peers (rig2 + 5 validators)');
  const rig2Peer = p2pPeers.find(p => p.handle === '@zoth-rig2');
  assert(rig2Peer, '@zoth-rig2 peer must exist in registry');
  assert.strictEqual(rig2Peer.role, 'AI_WORKER');

  // Connect new peer
  const connRes = nodeReloaded.connectPeerNode({
    endpoint: 'http://192.168.1.150:8140',
    handle: '@zoth-worker-3',
    role: 'AI_WORKER',
    region: 'us-east-edge'
  });
  assert.strictEqual(connRes.ok, true);
  assert.strictEqual(connRes.peer.handle, '@zoth-worker-3');

  // Delta Sync
  const deltaRes = nodeReloaded.getPeerDelta(0);
  assert.strictEqual(deltaRes.ok, true);
  assert(deltaRes.deltaCount >= 10, 'Delta blocks count must be >= 10');
  assert.strictEqual(deltaRes.merkleStateRoot, merkleResult.merkleRoot);

  // Ingest Gossip Block
  const sampleBlock = {
    height: 999,
    account: '@zoth-rig2',
    type: 'AI_TASK_RESULT',
    hash: 'a'.repeat(64),
    previousHash: '0'.repeat(64),
    timestamp: new Date().toISOString(),
    quorumCertificate: {
      status: 'FINALIZED_BFT',
      approvals: 5,
      threshold: 4,
      validators: ['val-alpha', 'val-beta', 'val-gamma', 'val-delta', 'val-epsilon']
    }
  };
  const gossipRes = nodeReloaded.ingestPeerGossipBlock(sampleBlock, 'peer_zoth_rig2');
  assert.strictEqual(gossipRes.ok, true);
  assert.strictEqual(gossipRes.accepted, true);

  // Gossip rejection on invalid / sub-threshold quorum
  assert.throws(() => {
    nodeReloaded.ingestPeerGossipBlock({
      height: 1000,
      account: '@attacker',
      type: 'INVALID',
      hash: 'b'.repeat(64),
      quorumCertificate: { status: 'PENDING', approvals: 2, threshold: 4 }
    });
  }, /BFT quorum certificate unverified or sub-threshold/);

  // 5. MCP Tool #16 execution
  const mcpAuditRes = executeTool(nodeReloaded, 'vaelor_enterprise_audit_and_p2p', { mode: 'audit_and_sync' });
  assert.strictEqual(mcpAuditRes.ok, true);
  assert(mcpAuditRes.audit || mcpAuditRes.merkleStateRoot);

  // 6. CLI audit & peer commands
  const cliAuditRaw = execSync(`node "${cliBin}" --offline --json audit`, execOpts).toString();
  const cliAudit = JSON.parse(cliAuditRaw);
  assert.strictEqual(cliAudit.ok, true);
  assert(cliAudit.merkleStateRoot);

  const cliPeerRaw = execSync(`node "${cliBin}" --offline --json peer list`, execOpts).toString();
  const cliPeer = JSON.parse(cliPeerRaw);
  assert.strictEqual(cliPeer.ok, true);
  assert(cliPeer.peers.length >= 6);

  // =========================================================================
  // Feature 33: M-of-N Corporate Multi-Sig Treasury, Idempotency & HMAC Webhooks
  // =========================================================================
  console.log('Testing Feature #33: M-of-N Corporate Multi-Sig Treasury, Idempotency & HMAC Webhooks...');

  // 1. Multi-Sig Vault Registry
  const msigVaults = nodeReloaded.getMultisigVaults();
  assert(msigVaults.length >= 1, 'At least 1 corporate multi-sig vault must exist');
  const zothVault = msigVaults.find(v => v.id === 'msig_zoth_foundation');
  assert(zothVault, 'msig_zoth_foundation vault must exist');
  assert.strictEqual(zothVault.threshold, 2, 'Default corporate vault must be 2-of-3 threshold');
  assert.deepStrictEqual(zothVault.signers, ['@neal', '@zoth', '@sprig']);
  assert(zothVault.balanceVlr >= 500, 'Corporate treasury must have pre-funded VLR');

  // 2. Propose Multi-Sig Transfer
  const propRes = nodeReloaded.proposeMultisigTx({
    vaultId: 'msig_zoth_foundation',
    proposer: '@neal',
    to: '@sprig',
    amountVlr: 50.0,
    memo: 'Q4 Open Source Ecosystem Grant'
  });
  assert.strictEqual(propRes.ok, true);
  assert(propRes.proposal.id.startsWith('prop_'));
  assert.strictEqual(propRes.proposal.status, 'PENDING');
  assert.deepStrictEqual(propRes.proposal.approvals, ['@neal']);
  assert.strictEqual(propRes.executed, false);

  // Unauthorized proposer check
  assert.throws(() => {
    nodeReloaded.proposeMultisigTx({
      vaultId: 'msig_zoth_foundation',
      proposer: '@unauthorized',
      to: '@sprig',
      amountVlr: 10.0
    });
  }, /not an authorized signer/);

  // Duplicate approval check from same signer
  assert.throws(() => {
    nodeReloaded.approveMultisigTx({
      proposalId: propRes.proposal.id,
      signer: '@neal'
    });
  }, /has already approved proposal/);

  // 3. Second Co-Signature & Quorum Execution
  const sprigBalBeforeMsig = nodeReloaded.resolveAccount('@sprig').balanceVael;
  const approveRes = nodeReloaded.approveMultisigTx({
    proposalId: propRes.proposal.id,
    signer: '@zoth'
  });
  assert.strictEqual(approveRes.ok, true);
  assert.strictEqual(approveRes.executed, true, 'Threshold reached (2/2) -> auto executed');
  assert.strictEqual(approveRes.proposal.status, 'EXECUTED');
  assert.strictEqual(approveRes.execBlock.type, 'MULTISIG_EXEC');
  assert.strictEqual(approveRes.execBlock.quorumCertificate.status, 'FINALIZED_BFT');
  assert.strictEqual(approveRes.receiveBlock.type, 'RECEIVE');

  // Recipient balance verification
  const sprigBalAfterMsig = nodeReloaded.resolveAccount('@sprig').balanceVael;
  assert.strictEqual(sprigBalAfterMsig, sprigBalBeforeMsig + 50 * VAEL_PER_VLR);

  // Re-approval of already executed proposal must throw
  assert.throws(() => {
    nodeReloaded.approveMultisigTx({
      proposalId: propRes.proposal.id,
      signer: '@sprig'
    });
  }, /has already been executed/);

  // 4. HMAC-SHA256 Signed Webhook Event Generation
  const hookEvent = nodeReloaded.generateWebhookEvent('treasury.disbursement.completed', {
    proposalId: propRes.proposal.id,
    amountVlr: 50.0,
    to: '@sprig'
  });
  assert.strictEqual(hookEvent.ok, true);
  assert(hookEvent.signatureHeader.includes('t=') && hookEvent.signatureHeader.includes('v1='));
  assert.strictEqual(hookEvent.signatureValid, true, 'HMAC signature must verify against secret');

  const hookDeliveries = nodeReloaded.getWebhookDeliveries();
  assert(hookDeliveries.length >= 1, 'Webhook deliveries must be logged in state');

  // 5. MCP Tool #17 execution
  const mcpMsigRes = executeTool(nodeReloaded, 'vaelor_multisig_treasury', {
    proposalId: propRes.proposal.id,
    signerHandle: '@zoth',
    idempotencyKey: 'idem_test_123'
  });
  assert.strictEqual(mcpMsigRes.ok, true);
  assert.strictEqual(mcpMsigRes.thresholdReached, true);

  // 6. CLI multisig commands
  const cliMsigRaw = execSync(`node "${cliBin}" --offline --json multisig list`, execOpts).toString();
  const cliMsig = JSON.parse(cliMsigRaw);
  assert.strictEqual(cliMsig.ok, true);
  assert(cliMsig.vaults.length >= 1);

  // 7. SDK helper methods
  VaelorPay.setLocalNode(nodeReloaded);
  const sdkIntegrity = await VaelorPay.verifyChainIntegrity();
  assert.strictEqual(sdkIntegrity.ok, true);
  assert(sdkIntegrity.merkleStateRoot);

  const sdkPeers = await VaelorPay.getP2pPeers();
  assert.strictEqual(sdkPeers.ok, true);
  assert(sdkPeers.peers.length >= 6);

  const sdkVaults = await VaelorPay.getMultisigVaults();
  assert.strictEqual(sdkVaults.ok, true);
  assert(sdkVaults.vaults.length >= 1);

  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  console.log('✅ All Vaelor (VLR) Account-Lattice DAG, Ed25519, Invoices, Subscriptions, Bridge, 5-Validator Quorum, Guardian Recovery, Money Streaming, Split Cashback, Offline Tap Vouchers, PoUW Savings Vault (8.5% APY), Itemized Smart Receipts, AI Agent M2M Bounties, Verified Merchant Directory, Delegated Sub-Accounts, Privacy Shielded Transfers, Social Group Tabs, Sovereign Inheritance, 0% APR Revolving Credit Line, Drop-In Merchant POS SDK, 17-Tool MCP Server, vaelor-cli, Creator Feeless Tip Jars, Loyalty Multiplier Tiers, Multi-Currency Merchant FX, Zero-Penalty Protected Escrows, 28-Feature SDK DAG Stress Benchmark, Sovereign CPA Tax Exporter, ZothOS Passphrase-Gated P2P Messenger, Enterprise Merkle State Root & Corporate Multi-Sig Treasury tests PASSED (33/33)!');
})().catch((err) => {
  console.error('Test Suite Failed:', err);
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  process.exit(1);
});

