// ─── LeadsTab.test.jsx ────────────────────────────────────────────────────────
// Integration tests for src/tabs/LeadsTab.jsx
//
// LeadsTab requires ThemeProvider from context/ThemeContext.jsx.
// ThemeContext calls applyTheme() on mount, which touches document DOM and
// localStorage — both available in jsdom.
//
// Prop shape accepted by LeadsTab:
//   data              — { "Bank Connected": Lead[], "Form Submitted": Lead[], "Incomplete": Lead[] }
//   starredEmails     — Set<string>  (default: new Set())
//   toggleStar        — (email: string) => void  (default: () => {})
//   defaultCat        — string  (default: "Form Submitted")
//   defaultSort       — string  (default: "created")

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import LeadsTab from "../tabs/LeadsTab.jsx";

// ─── Wrapper ──────────────────────────────────────────────────────────────────

function Wrapper({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// ─── Test data ────────────────────────────────────────────────────────────────

const SAMPLE_LEADS_BC = [
  { name: "Ana García", email: "ana@gmail.com", created: "2026-03-01", purpose: "personal", country: "es", employment: "employed", income: 2500 },
  { name: "Carlos Ruiz", email: "carlos@gmail.com", created: "2026-02-28", purpose: "mortgage", country: "es", employment: "civil_servant", income: 3200 },
];

const SAMPLE_LEADS_FS = [
  { name: "Maria Lopez", email: "maria@outlook.com", created: "2026-03-02", purpose: "personal", country: "es", employment: "employed", income: 1800 },
  { name: "Pedro Navarro", email: "pedro@gmail.com", created: "2026-03-01", purpose: "", country: "en", employment: "self_employed", income: 2100 },
];

const EMPTY_DATA = {
  "Bank Connected": [],
  "Form Submitted": [],
  "Incomplete": [],
};

const SAMPLE_DATA = {
  "Bank Connected": SAMPLE_LEADS_BC,
  "Form Submitted": SAMPLE_LEADS_FS,
  "Incomplete": [],
};

// ─── Empty state ──────────────────────────────────────────────────────────────

describe("LeadsTab — empty data", () => {
  it("renders without crashing when all categories are empty", () => {
    expect(() =>
      render(
        <Wrapper>
          <LeadsTab data={EMPTY_DATA} />
        </Wrapper>
      )
    ).not.toThrow();
  });

  it("shows category buttons even with 0 leads", () => {
    render(
      <Wrapper>
        <LeadsTab data={EMPTY_DATA} />
      </Wrapper>
    );
    // Multiple elements may render these strings (sidebar + header), so use getAllByText
    expect(screen.getAllByText("Bank Connected").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Form Submitted").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Incomplete").length).toBeGreaterThanOrEqual(1);
  });

  it("shows zero count badge in category sidebar for empty categories", () => {
    render(
      <Wrapper>
        <LeadsTab data={EMPTY_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    // All category counts are 0 — badges display "0"
    const zeroBadges = screen.getAllByText("0");
    expect(zeroBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("does not crash when data prop is missing a category key", () => {
    // data only has Bank Connected — Form Submitted and Incomplete fallback to []
    const partialData = { "Bank Connected": [] };
    expect(() =>
      render(
        <Wrapper>
          <LeadsTab data={partialData} />
        </Wrapper>
      )
    ).not.toThrow();
  });
});

// ─── Lead rendering ───────────────────────────────────────────────────────────

describe("LeadsTab — rendering leads", () => {
  it("renders lead names from the active category", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    expect(screen.getByText(/Ana García/i)).toBeInTheDocument();
    expect(screen.getByText(/Carlos Ruiz/i)).toBeInTheDocument();
  });

  it("does not render leads from a different category", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    expect(screen.queryByText(/Maria Lopez/i)).not.toBeInTheDocument();
  });

  it("shows correct lead count chip for the active category", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    // "2" appears in multiple chips; verify at least one instance is present
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
  });

  it("switches visible leads when a different category button is clicked", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    // Click Form Submitted category
    const fsButton = screen.getByRole("button", { name: /Form Submitted/i });
    fireEvent.click(fsButton);
    expect(screen.getByText(/Maria Lopez/i)).toBeInTheDocument();
    expect(screen.queryByText(/Ana García/i)).not.toBeInTheDocument();
  });
});

// ─── Search filter ────────────────────────────────────────────────────────────

describe("LeadsTab — search filter", () => {
  it("filters leads by name", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    const searchInput = screen.getByPlaceholderText(/search name/i);
    fireEvent.change(searchInput, { target: { value: "Ana" } });
    expect(screen.getByText(/Ana García/i)).toBeInTheDocument();
    expect(screen.queryByText(/Carlos Ruiz/i)).not.toBeInTheDocument();
  });

  it("filters leads by email", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    const searchInput = screen.getByPlaceholderText(/search name/i);
    fireEvent.change(searchInput, { target: { value: "carlos@gmail" } });
    expect(screen.getByText(/Carlos Ruiz/i)).toBeInTheDocument();
    expect(screen.queryByText(/Ana García/i)).not.toBeInTheDocument();
  });

  it("shows zero results (empty table body) for no match", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    const searchInput = screen.getByPlaceholderText(/search name/i);
    fireEvent.change(searchInput, { target: { value: "zzznomatchzzz" } });
    expect(screen.queryByText(/Ana García/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Carlos Ruiz/i)).not.toBeInTheDocument();
  });

  it("search is case-insensitive", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    const searchInput = screen.getByPlaceholderText(/search name/i);
    fireEvent.change(searchInput, { target: { value: "ANA" } });
    expect(screen.getByText(/Ana García/i)).toBeInTheDocument();
  });

  it("clearing search restores all leads", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    const searchInput = screen.getByPlaceholderText(/search name/i);
    fireEvent.change(searchInput, { target: { value: "Carlos" } });
    expect(screen.queryByText(/Ana García/i)).not.toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText(/Ana García/i)).toBeInTheDocument();
    expect(screen.getByText(/Carlos Ruiz/i)).toBeInTheDocument();
  });

  it("shows 'Clear' button when search is active", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    const searchInput = screen.getByPlaceholderText(/search name/i);
    fireEvent.change(searchInput, { target: { value: "Ana" } });
    // The clear button contains "✕ Clear" text
    expect(screen.getByText(/clear/i)).toBeInTheDocument();
  });

  it("clicking Clear button resets search", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    const searchInput = screen.getByPlaceholderText(/search name/i);
    fireEvent.change(searchInput, { target: { value: "Ana" } });
    expect(screen.queryByText(/Carlos Ruiz/i)).not.toBeInTheDocument();

    const clearBtn = screen.getByText(/clear/i);
    fireEvent.click(clearBtn);
    expect(screen.getByText(/Ana García/i)).toBeInTheDocument();
    expect(screen.getByText(/Carlos Ruiz/i)).toBeInTheDocument();
  });
});

// ─── Category switching clears filters ───────────────────────────────────────

describe("LeadsTab — category switching resets filters", () => {
  it("switching category clears the search input", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    const searchInput = screen.getByPlaceholderText(/search name/i);
    fireEvent.change(searchInput, { target: { value: "Ana" } });

    fireEvent.click(screen.getByRole("button", { name: /Form Submitted/i }));
    // After switching, search should be cleared — Maria Lopez (FS) should be visible
    expect(screen.getByText(/Maria Lopez/i)).toBeInTheDocument();
  });
});

// ─── Collapse / Expand toggle ─────────────────────────────────────────────────

describe("LeadsTab — collapse/expand table", () => {
  it("shows 'Collapse' button when table is expanded (default)", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    expect(screen.getByText("Collapse")).toBeInTheDocument();
  });

  it("clicking Collapse hides the lead rows", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    fireEvent.click(screen.getByText("Collapse"));
    expect(screen.queryByText(/Ana García/i)).not.toBeInTheDocument();
  });

  it("clicking Expand after Collapse shows lead rows again", () => {
    render(
      <Wrapper>
        <LeadsTab data={SAMPLE_DATA} defaultCat="Bank Connected" />
      </Wrapper>
    );
    fireEvent.click(screen.getByText("Collapse"));
    fireEvent.click(screen.getByText("Expand"));
    expect(screen.getByText(/Ana García/i)).toBeInTheDocument();
  });
});
