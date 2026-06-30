import { useState } from 'react'

interface TutorialOverlayProps {
  onDone: () => void
  onSkip: () => void
}

const tutorialSteps = [
  {
    title: 'Welcome To Yuki Sim',
    body: 'This is a fictional market. Your goal is to practice reading price action, managing risk, and learning how stocks and options react.',
  },
  {
    title: 'Start With The Watchlist',
    body: 'Click any stock or index on the left to load its chart and options chain. PNS and TSQ are index underlyings for options only.',
  },
  {
    title: 'Use The Chart',
    body: 'Switch timeframes, draw trend lines, add horizontal levels, and watch live P/L markers once you open a position.',
  },
  {
    title: 'Place A Trade',
    body: 'Use the Trade Ticket for stock orders or click Bid/Ask in the Options Chain to buy calls and puts.',
  },
  {
    title: 'End The Day',
    body: 'When you want a session recap, hit End Day in the header. You will get a performance report and a fresh starting point for the next session.',
  },
]

export default function TutorialOverlay({ onDone, onSkip }: TutorialOverlayProps) {
  const [step, setStep] = useState(0)
  const current = tutorialSteps[step]
  const final = step === tutorialSteps.length - 1

  return (
    <div className="tutorial-backdrop">
      <section className="tutorial-card">
        <div className="tutorial-card__head">
          <span>Quick Tutorial</span>
          <button type="button" onClick={onSkip}>Skip</button>
        </div>
        <div className="tutorial-card__progress">
          {tutorialSteps.map((_, i) => (
            <span
              // Static step indicators.
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className={i <= step ? 'tutorial-card__dot tutorial-card__dot--active' : 'tutorial-card__dot'}
            />
          ))}
        </div>
        <h2>{current.title}</h2>
        <p>{current.body}</p>
        <div className="tutorial-card__actions">
          <button
            type="button"
            className="tutorial-card__secondary"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </button>
          <button
            type="button"
            className="tutorial-card__primary"
            onClick={() => final ? onDone() : setStep((s) => s + 1)}
          >
            {final ? 'Start Trading' : 'Next'}
          </button>
        </div>
      </section>
    </div>
  )
}
