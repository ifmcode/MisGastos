import { describe, expect, it } from "@jest/globals";

import type { DashboardHeaderProps } from "../dashboard-header";

type MovedTransferProps = Extract<
  keyof DashboardHeaderProps,
  "showTransferButton" | "onTransferPress"
>;

// Compile-time contract: the transfer action now lives in the wallets tab, so
// the header must not accept its old props again. If any is reintroduced this
// constant becomes `false` and `tsc --noEmit` fails.
const headerHasNoTransferProps: MovedTransferProps extends never ? true : false =
  true;

describe("DashboardHeader contract", () => {
  it("does not accept the transfer button props anymore", () => {
    expect(headerHasNoTransferProps).toBe(true);
  });

  it("accepts the greeting as its only required prop", () => {
    const props: DashboardHeaderProps = { greeting: "Hola, Ana" };

    expect(props.greeting).toBe("Hola, Ana");
  });
});
