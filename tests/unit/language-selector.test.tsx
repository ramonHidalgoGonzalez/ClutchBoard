import { fireEvent, render, screen } from "@testing-library/react"
import { vi } from "vitest"

import { LanguageSelector } from "@/components/settings/language-selector"
import { I18nProvider } from "@/i18n/provider"
import { es } from "@/i18n/dictionaries/es"

const refresh = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }))

function renderSelector() {
  return render(
    <I18nProvider locale="es" dictionary={es}>
      <LanguageSelector />
    </I18nProvider>,
  )
}

describe("LanguageSelector", () => {
  it("renders all supported languages", () => {
    renderSelector()
    expect(screen.getByText("Español")).toBeInTheDocument()
    expect(screen.getByText("English")).toBeInTheDocument()
    expect(screen.getByText("Português")).toBeInTheDocument()
    expect(screen.getByText("Français")).toBeInTheDocument()
    expect(screen.getByText("Deutsch")).toBeInTheDocument()
  })

  it("persists the chosen language to cookie and localStorage", () => {
    renderSelector()
    fireEvent.click(screen.getByText("English"))
    expect(document.cookie).toContain("clutchboard_locale=en")
    expect(window.localStorage.getItem("clutchboard_locale")).toBe("en")
    expect(refresh).toHaveBeenCalled()
  })
})
