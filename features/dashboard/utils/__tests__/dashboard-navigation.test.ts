import { describe, expect, it, jest } from "@jest/globals";

import { createDashboardNavigationActions } from "../dashboard-navigation";

describe("createDashboardNavigationActions", () => {
  it("opens the transactions tab", () => {
    const navigate = jest.fn();
    const push = jest.fn();
    const actions = createDashboardNavigationActions({ navigate, push });

    actions.openMovements();

    expect(navigate).toHaveBeenCalledWith("/transactions");
    expect(push).not.toHaveBeenCalled();
  });

  it("opens the transfer history", () => {
    const navigate = jest.fn();
    const push = jest.fn();
    const actions = createDashboardNavigationActions({ navigate, push });

    actions.openTransferHistory();

    expect(push).toHaveBeenCalledWith("/transfers");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("pushes the shared expense detail of a linked movement", () => {
    const navigate = jest.fn();
    const push = jest.fn();
    const actions = createDashboardNavigationActions({ navigate, push });

    actions.openSharedExpense("expense-1");

    expect(push).toHaveBeenCalledWith("/social/expenses/expense-1");
    expect(navigate).not.toHaveBeenCalled();
  });
});
