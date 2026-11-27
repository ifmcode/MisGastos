import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../local-transfer.cache", () => ({
  cacheTransfers: jest.fn(),
  cacheTransfer: jest.fn(),
  readCachedTransfers: jest.fn(async () => null),
}));

import {
  cacheTransfer,
  cacheTransfers,
  readCachedTransfers,
} from "../local-transfer.cache";
import { CachedTransferRepository } from "../cached-transfer.repository";
import {
  ITransferRepository,
  TransferMutationResult,
} from "../transfer.repository";
import {
  CreateTransferDto,
  UpdateTransferDto,
} from "../../types/transfer.types";
import { buildTransfer } from "./local-transfer.fixtures";

const listMock = jest.mocked(cacheTransfers);
const singleMock = jest.mocked(cacheTransfer);
const readMock = jest.mocked(readCachedTransfers);

function createRemote(): jest.Mocked<ITransferRepository> {
  return {
    getTransfers: jest.fn(),
    getTransfer: jest.fn(),
    createTransfer: jest.fn(),
    updateTransfer: jest.fn(),
    deleteTransfer: jest.fn(),
  };
}

const dto: CreateTransferDto = {
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: 10,
  currency: "EUR",
  date: "2026-10-30",
};

function buildResult(): TransferMutationResult {
  return { transfer: buildTransfer(), wallets: [] };
}

describe("CachedTransferRepository", () => {
  let remote: jest.Mocked<ITransferRepository>;
  let repository: CachedTransferRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    remote = createRemote();
    repository = new CachedTransferRepository(remote);
  });

  it("mirrors the list read and returns the remote list", async () => {
    const transfers = [buildTransfer()];
    remote.getTransfers.mockResolvedValue(transfers);

    await expect(repository.getTransfers("owner-1")).resolves.toBe(transfers);

    expect(remote.getTransfers).toHaveBeenCalledWith("owner-1");
    expect(listMock).toHaveBeenCalledWith(
      "owner-1",
      transfers,
      expect.any(String),
    );
  });

  it("returns the merged cache so a pending local row survives a stale remote read", async () => {
    const remoteList = [buildTransfer({ id: "server-1" })];
    const merged = [
      buildTransfer({ id: "server-1" }),
      buildTransfer({ id: "local-pending" }),
    ];
    remote.getTransfers.mockResolvedValue(remoteList);
    readMock.mockResolvedValueOnce(merged);

    await expect(repository.getTransfers("owner-1")).resolves.toBe(merged);
  });

  it("does not reject when the list cache write fails", async () => {
    const transfers = [buildTransfer()];
    remote.getTransfers.mockResolvedValue(transfers);
    listMock.mockRejectedValueOnce(new Error("disk full"));

    await expect(repository.getTransfers("owner-1")).resolves.toBe(transfers);
  });

  it("delegates getTransfer without touching the cache", async () => {
    const transfer = buildTransfer();
    remote.getTransfer.mockResolvedValue(transfer);

    await expect(
      repository.getTransfer("owner-1", "transfer-1"),
    ).resolves.toBe(transfer);
    expect(remote.getTransfer).toHaveBeenCalledWith("owner-1", "transfer-1");
    expect(singleMock).not.toHaveBeenCalled();
  });

  it("mirrors the created record and returns the remote result", async () => {
    const result = buildResult();
    remote.createTransfer.mockResolvedValue(result);

    await expect(repository.createTransfer("owner-1", dto)).resolves.toBe(
      result,
    );
    expect(remote.createTransfer).toHaveBeenCalledWith("owner-1", dto);
    expect(singleMock).toHaveBeenCalledWith(
      "owner-1",
      result.transfer,
      expect.any(String),
    );
  });

  it("mirrors the updated record", async () => {
    const result = buildResult();
    const update: UpdateTransferDto = dto;
    remote.updateTransfer.mockResolvedValue(result);

    await expect(
      repository.updateTransfer("owner-1", "transfer-1", update),
    ).resolves.toBe(result);
    expect(singleMock).toHaveBeenCalledWith(
      "owner-1",
      result.transfer,
      expect.any(String),
    );
  });

  it("mirrors the soft-deleted record returned by delete", async () => {
    const result: TransferMutationResult = {
      transfer: buildTransfer({ deletedAt: "2026-11-01T10:00:00.000Z" }),
      wallets: [],
    };
    remote.deleteTransfer.mockResolvedValue(result);

    await expect(
      repository.deleteTransfer("owner-1", "transfer-1"),
    ).resolves.toBe(result);
    expect(singleMock).toHaveBeenCalledWith(
      "owner-1",
      result.transfer,
      expect.any(String),
    );
  });

  it("does not reject when the single-record cache fails", async () => {
    const result = buildResult();
    remote.createTransfer.mockResolvedValue(result);
    singleMock.mockRejectedValueOnce(new Error("disk full"));

    await expect(repository.createTransfer("owner-1", dto)).resolves.toBe(
      result,
    );
  });
});
