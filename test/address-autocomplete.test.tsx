// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { AddressAutocomplete } from '~/components/address-autocomplete'
import { render, screen } from './test-utils'

describe('AddressAutocomplete', () => {
  it('renders as a text input', async () => {
    await render(<AddressAutocomplete placesEnabled={false} />)
    const input = screen.getByRole('combobox')
    expect(input).toBeDefined()
    expect(input.getAttribute('name')).toBe('address')
  })

  it('renders with default value', async () => {
    await render(
      <AddressAutocomplete defaultValue="Denver, CO" placesEnabled={false} />,
    )
    const input = screen.getByRole('combobox') as HTMLInputElement
    expect(input.value).toBe('Denver, CO')
  })

  it('renders hidden inputs for structured address fields', async () => {
    const { container } = await render(
      <AddressAutocomplete placesEnabled={false} />,
    )
    const hiddenInputs = container.querySelectorAll('input[type="hidden"]')
    const names = Array.from(hiddenInputs).map(el => el.getAttribute('name'))
    expect(names).toContain('addressStreet')
    expect(names).toContain('addressCity')
    expect(names).toContain('addressState')
    expect(names).toContain('addressZip')
    expect(names).toContain('addressCountry')
    expect(names).toContain('addressLat')
    expect(names).toContain('addressLng')
    expect(names).toContain('addressPlaceId')
  })

  it('populates hidden inputs with default details', async () => {
    const { container } = await render(
      <AddressAutocomplete
        defaultValue="123 Main St, Denver, CO 80202"
        defaultDetails={{
          street: '123 Main St',
          city: 'Denver',
          state: 'CO',
          zip: '80202',
          country: 'United States',
          lat: '39.7392',
          lng: '-104.9903',
          placeId: 'ChIJ123',
        }}
        placesEnabled={true}
      />,
    )
    const getHidden = (name: string) =>
      container.querySelector(
        `input[type="hidden"][name="${name}"]`,
      ) as HTMLInputElement
    expect(getHidden('addressStreet').value).toBe('123 Main St')
    expect(getHidden('addressCity').value).toBe('Denver')
    expect(getHidden('addressState').value).toBe('CO')
    expect(getHidden('addressZip').value).toBe('80202')
    expect(getHidden('addressCountry').value).toBe('United States')
    expect(getHidden('addressLat').value).toBe('39.7392')
    expect(getHidden('addressLng').value).toBe('-104.9903')
    expect(getHidden('addressPlaceId').value).toBe('ChIJ123')
  })

  it('does not show dropdown when places is disabled', async () => {
    await render(<AddressAutocomplete placesEnabled={false} />)
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
