import {
  Authorized,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  StakeProgram,
} from "@solana/web3.js";
import { sendTxHelper, sleep } from "./send";
import { getMoveStakeInstruction } from "./stake";

const STAKE_ACCOUNT_RENT = 0.00228288 * LAMPORTS_PER_SOL;
const connection = new Connection("http://localhost:8899");
const wallet = Keypair.generate();
const custodian = Keypair.generate();

await connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL);
console.log("Airdrop received by", wallet.publicKey.toBase58());

const stake_keypair = Keypair.generate();
const tx = StakeProgram.createAccount({
  authorized: new Authorized(wallet.publicKey, wallet.publicKey),
  fromPubkey: wallet.publicKey,
  lamports: 1 * LAMPORTS_PER_SOL + STAKE_ACCOUNT_RENT,
  // lockup: new Lockup(oldExpirationUnix, 0, custodian.publicKey),
  stakePubkey: stake_keypair.publicKey,
});

await sendTxHelper(connection, tx, wallet.publicKey, [stake_keypair, wallet]);
await sleep(6000);
console.log("Lock period expired");

const destination_stake_keypair = Keypair.generate();
const next_transaction = StakeProgram.createAccount({
  authorized: new Authorized(wallet.publicKey, wallet.publicKey),
  fromPubkey: wallet.publicKey,
  lamports: STAKE_ACCOUNT_RENT,
  // lockup: new Lockup(now + 20000, 0, custodian.publicKey),
  stakePubkey: destination_stake_keypair.publicKey,
}).add(
  getMoveStakeInstruction(
    StakeProgram.programId,
    stake_keypair.publicKey,
    destination_stake_keypair.publicKey,
    wallet.publicKey,
    1 * LAMPORTS_PER_SOL,
  ),
);

await sendTxHelper(connection, next_transaction, wallet.publicKey, [
  destination_stake_keypair,
  wallet,
]);
console.log("New stake account created");
