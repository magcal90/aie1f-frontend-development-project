import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { AuthProvider } from "../contexts/AuthContext";
import LoginPage from "./LoginPage";

function renderLoginPage(initialEntry = "/login") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<div>Dashboard Page</div>} />
          <Route
            path="/app/transactions"
            element={<div>Transactions Page</div>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("LoginPage", () => {
  it("renders the sign-in form", () => {
    renderLoginPage();

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows an error when the credentials are incorrect", async () => {
    renderLoginPage();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "wrong@email.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText("Incorrect email or password."),
    ).toBeInTheDocument();
  });

  it("logs in successfully and redirects to /app", async () => {
    renderLoginPage();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "victor@team3.io" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });

  it("redirects to the original protected page when location.state.from exists", async () => {
    renderLoginPage({
      pathname: "/login",
      state: { from: { pathname: "/app/transactions" } },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "victor@team3.io" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Transactions Page")).toBeInTheDocument();
  });

  it("updates the email and password values as the user types", () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(emailInput, {
      target: { value: "alex@team3.io" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "password123" },
    });

    expect(emailInput).toHaveValue("alex@team3.io");
    expect(passwordInput).toHaveValue("password123");
  });

  it("prevents submit when required fields are empty", () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByLabelText("Email")).toBeInvalid();
    expect(screen.getByLabelText("Password")).toBeInvalid();
  });

  it("clears the previous error and allows a retry after a failed login", async () => {
    renderLoginPage();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "wrong@email.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText("Incorrect email or password."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "victor@team3.io" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });

  it("requires email and password before submit", () => {
    renderLoginPage();

    expect(screen.getByLabelText("Email")).toHaveAttribute("required");
    expect(screen.getByLabelText("Password")).toHaveAttribute("required");
  });
});
