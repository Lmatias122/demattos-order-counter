import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./use-auth";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  eq: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: mocks.getUser,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: mocks.unsubscribe } } }),
    },
    from: () => ({ select: () => ({ eq: mocks.eq }) }),
  },
}));

function State() {
  const { user, hasRole, loading } = useAuth();
  return <output>{loading ? "loading" : `${user?.id ?? "signed-out"}:${hasRole("admin")}`}</output>;
}

describe("real authentication", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);
  it("does not grant a signed-out visitor the bypass admin identity", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    render(<AuthProvider><State /></AuthProvider>);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("signed-out:false"));
    expect(mocks.eq).not.toHaveBeenCalled();
  });
  it("loads admin permission only for the verified account", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "verified-admin" } }, error: null });
    mocks.eq.mockResolvedValue({ data: [{ role: "admin" }], error: null });
    render(<AuthProvider><State /></AuthProvider>);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("verified-admin:true"));
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "verified-admin");
  });
});