import { struct, u32, ns64, blob, u8 } from "@solana/buffer-layout";
import type { Layout } from "@solana/buffer-layout";
import { TransactionInstruction, StakeProgram } from "@solana/web3.js";
import type { PublicKey } from "@solana/web3.js";

interface SetLockupClientData {
  unixTimestamp?: number;
  epoch?: number;
  custodian?: PublicKey;
}

const publicKey = (property = "publicKey") => {
  return blob(32, property);
};

export function getSetLockupInstruction(
  programId: PublicKey,
  stakePubkey: PublicKey,
  lockupData: SetLockupClientData,
  authorityPubkey: PublicKey,
): TransactionInstruction {
  const fields: Layout<any>[] = [u32("instruction")];
  fields.push(ns64("lamports"));
  const lockupFields: any = {};

  if (lockupData.unixTimestamp !== undefined) {
    fields.push(u8("presenceUnixTimestamp"));
    lockupFields.presenceUnixTimestamp = 1;
    fields.push(ns64("unixTimestamp"));
    lockupFields.unixTimestamp = lockupData.unixTimestamp;
  } else {
    fields.push(u8("presenceUnixTimestamp"));
    lockupFields.presenceFlag = 0;
  }

  if (lockupData.epoch !== undefined) {
    fields.push(u8("presenceEpoch"));
    lockupFields.presenceEpoch = 1;
    fields.push(ns64("epoch"));
    lockupFields.epoch = lockupData.epoch;
  } else {
    fields.push(u8("presenceEpoch"));
    lockupFields.presenceFlag = 0;
  }

  if (lockupData.custodian !== undefined) {
    fields.push(u8("presenceCustodian"));
    lockupFields.presenceCustodian = 1;
    fields.push(publicKey("custodian"));
    lockupFields.custodian = lockupData.custodian.toBuffer();
  } else {
    fields.push(u8("presenceCustodian"));
    lockupFields.presenceCustodian = 0;
  }

  const INSTRUCTION_LAYOUT = struct<any>(fields);

  const data = Buffer.alloc(INSTRUCTION_LAYOUT.span);
  INSTRUCTION_LAYOUT.encode(
    {
      instruction: 6, // SetLockup index
      ...lockupFields,
    },
    data,
  );

  const keys = [
    { pubkey: stakePubkey, isSigner: false, isWritable: true },
    { pubkey: authorityPubkey, isSigner: true, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}

export interface MoveStakeInstructionInterface {
  readonly instruction: number;
  readonly lamports: number;
}

export function getMoveStakeInstruction(
  programId: PublicKey,
  source: PublicKey,
  destination: PublicKey,
  stakeAuthority: PublicKey,
  lamports: number,
): TransactionInstruction {
  const MoveStakeLayout = struct<MoveStakeInstructionInterface>([
    u32("instruction"),
    ns64("lamports"),
  ]);

  const data = Buffer.alloc(MoveStakeLayout.span);
  MoveStakeLayout.encode(
    {
      instruction: 17, // MoveStake index
      lamports,
    },
    data,
  );

  const keys = [
    { pubkey: source, isSigner: false, isWritable: true },
    { pubkey: destination, isSigner: true, isWritable: true },
    { pubkey: stakeAuthority, isSigner: true, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}
