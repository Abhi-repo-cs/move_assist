import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '../pages/Home.jsx'

const png = () => new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'room.png', { type: 'image/png' })

function mockFetch(analyzeResponse) {
  globalThis.fetch = vi.fn(async (url) => {
    if (String(url).endsWith('/api/health')) {
      return { ok: true, status: 200, json: async () => ({ status: 'ok', demo_mode: true, ai_configured: false }) }
    }
    return analyzeResponse()
  })
}

beforeEach(() => mockFetch(() => ({ ok: true, status: 200, json: async () => ({}) })))

describe('Home', () => {
  it('shows Demo Mode status', async () => {
    render(<Home />)
    expect(await screen.findAllByText(/Demo Mode/)).not.toHaveLength(0)
  })

  it('asks for an image when none is selected', async () => {
    render(<Home />)
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'What is ahead of me?' } })
    fireEvent.click(screen.getByRole('button', { name: /Analyze environment/ }))
    expect(await screen.findByText(/Add an image first/)).toBeInTheDocument()
  })

  it('asks for a question when empty', async () => {
    render(<Home />)
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [png()] } })
    fireEvent.click(screen.getByRole('button', { name: /Analyze environment/ }))
    expect(await screen.findByText(/Type or speak a question/)).toBeInTheDocument()
  })

  it('goes image -> question -> response', async () => {
    mockFetch(() => ({
      ok: true,
      status: 200,
      json: async () => ({
        answer: 'A doorway appears to be visible ahead.',
        observations: [{ object: 'doorway', relative_position: 'ahead', confidence: 0.6 }],
        interpretation: 'It may be an exit.',
        uncertainty: 'One image cannot confirm safety.',
        safety_note: 'Verify independently.',
        demo_mode: true,
        model: 'demo',
      }),
    }))
    render(<Home />)
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [png()] } })
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'What is ahead of me?' } })
    fireEvent.click(screen.getByRole('button', { name: /Analyze environment/ }))
    expect(await screen.findByTestId('answer')).toHaveTextContent('doorway appears')
    expect(screen.getByText('Observed')).toBeInTheDocument()
    expect(screen.getByText('Interpretation')).toBeInTheDocument()
    expect(screen.getByText('Uncertainty')).toBeInTheDocument()
  })

  it('shows an API error without crashing', async () => {
    mockFetch(() => ({ ok: false, status: 502, json: async () => ({ detail: 'The model returned a malformed response.' }) }))
    render(<Home />)
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [png()] } })
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'Describe the environment.' } })
    fireEvent.click(screen.getByRole('button', { name: /Analyze environment/ }))
    await waitFor(() => expect(screen.getByText(/malformed response/)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Analyze environment/ })).toBeEnabled()
  })

  it('rejects unsupported file types', async () => {
    render(<Home />)
    const bad = new File(['x'], 'a.gif', { type: 'image/gif' })
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [bad] } })
    expect(await screen.findByText(/Unsupported file/)).toBeInTheDocument()
  })
})
