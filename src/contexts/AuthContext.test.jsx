import { useContext } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AuthContext, AuthProvider } from "./AuthContext";

function UserDisplay() {
  const { user } = useContext(AuthContext);
  return <span>{user ? user.email : "No user"}</span>;
}

it("starts with no user when saved user data is malformed", () => {
  localStorage.setItem("kakeibo_user", "not valid JSON");

  render(
    <AuthProvider>
      <UserDisplay />
    </AuthProvider>,
  );

  expect(screen.getByText("No user")).toBeInTheDocument();
});

function AuthProbe() {
  const { user, login, logout, hasRole } = useContext(AuthContext);

  return (
    <>
      <p>{user ? `Signed in as ${user.name}` : "Signed out"}</p>
      <p>{hasRole("admin") ? "Admin" : "Not admin"}</p>
      <button onClick={() => login({ name: "Victor", role: "admin" })}>
        Log in
      </button>
      <button onClick={logout}>Log out</button>
    </>
  );
}

function renderAuthProbe() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

it("starts signed out when there is no saved user", () => {
  renderAuthProbe();

  expect(screen.getByText("Signed out")).toBeInTheDocument();
  expect(screen.getByText("Not admin")).toBeInTheDocument();
});

it("restores a saved user from local storage", () => {
  localStorage.setItem(
    "kakeibo_user",
    JSON.stringify({ name: "Victor", role: "admin" }),
  );

  renderAuthProbe();

  expect(screen.getByText("Signed in as Victor")).toBeInTheDocument();
  expect(screen.getByText("Admin")).toBeInTheDocument();
});

it("saves the user on login and removes them on logout", () => {
  renderAuthProbe();

  fireEvent.click(screen.getByRole("button", { name: "Log in" }));

  expect(screen.getByText("Signed in as Victor")).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("kakeibo_user"))).toEqual({
    name: "Victor",
    role: "admin",
  });

  fireEvent.click(screen.getByRole("button", { name: "Log out" }));

  expect(screen.getByText("Signed out")).toBeInTheDocument();
  expect(localStorage.getItem("kakeibo_user")).toBeNull();
});