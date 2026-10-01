import { useCallback, useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import Header from '../components/Header.jsx'
import ImagePanel from '../components/ImagePanel.jsx'
import QuestionPanel from '../components/QuestionPanel.jsx'
import ResponsePanel from '../components/ResponsePanel.jsx'
import SafetyNotice from '../components/SafetyNotice.jsx'
import ResearchContext from '../components/ResearchContext.jsx'
import useSpeechRecognition from '../hooks/useSpeechRecognition.js'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis.js'
import { analyzeEnvironment, getHealth } from '../services/api.js'
import { validateImage, validateQuestion } from '../services/validation.js'

export default function Home() {
  const [health, setHealth] = useState(null)
  const [checking, setChecking] = useState(true)
  const [image, setImage] = useState(null) // { file, url }
  const [imageError, setImageError] = useState('')
  const [question, setQuestion] = useState('')
  const [questionError, setQuestionError] = useState('')
  const [mode, setMode] = useState('concise')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [apiError, setApiError] = useState('')
  const [autoRead, setAutoRead] = useState(false)

  const tts = useSpeechSynthesis()
  const speech = useSpeechRecognition((text) => {
    setQuestion(text)
    setQuestionError('')
  })

  useEffect(() => {
    getHealth().then((h) => {
      setHealth(h)
      setChecking(false)
    })
  }, [])

  useEffect(() => () => image && URL.revokeObjectURL(image.url), [image])

  const selectImage = useCallback((file) => {
    const problem = validateImage(file)
    if (problem) {
      setImageError(problem)
      return
    }
    setImageError('')
    setResult(null)
    setApiError('')
    setImage({ file, url: URL.createObjectURL(file) })
  }, [])

  const removeImage = () => {
    setImage(null)
    setResult(null)
    setApiError('')
    tts.cancel()
  }

  const submit = async () => {
    const imgProblem = validateImage(image?.file)
    const qProblem = validateQuestion(question)
    setImageError(imgProblem || '')
    setQuestionError(qProblem || '')
    setApiError('')
    if (imgProblem || qProblem) return

    tts.cancel()
    setLoading(true)
    setResult(null)
    try {
      const r = await analyzeEnvironment({ image: image.file, question: question.trim(), mode })
      setResult(r)
      if (autoRead) tts.speak(`${r.answer} ${r.uncertainty}`.trim())
    } catch (err) {
      setApiError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Skip to main content
      </a>
      <Header health={health} checking={checking} />

      <main id="main" className="mx-auto max-w-6xl space-y-6 px-4 pb-16 sm:px-6">
        {health?.demo_mode && (
          <div
            role="note"
            className="flex items-start gap-3 rounded-2xl border-2 border-warn bg-warn-bg p-4 font-bold text-warn"
          >
            <TriangleAlert size={24} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              Demo Mode is on. Responses are fixed examples and do not analyze your image. Set DEMO_MODE=false and add
              an API key to use a real model.
            </p>
          </div>
        )}
        {!checking && !health && (
          <p role="alert" className="rounded-2xl border-2 border-danger bg-danger-bg p-4 font-bold text-danger">
            Cannot reach the MoveAssist server. Start the backend (see README) and reload this page.
          </p>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <ImagePanel
              image={image}
              error={imageError}
              onSelect={selectImage}
              onRemove={removeImage}
              onError={setImageError}
            />
            <QuestionPanel
              question={question}
              onQuestion={(v) => {
                setQuestion(v)
                setQuestionError('')
              }}
              mode={mode}
              onMode={setMode}
              onSubmit={submit}
              loading={loading}
              error={questionError}
              speech={speech}
            />
          </div>
          <div className="space-y-6 lg:sticky lg:top-6">
            <ResponsePanel
              result={result}
              loading={loading}
              error={apiError}
              tts={tts}
              autoRead={autoRead}
              onAutoRead={setAutoRead}
            />
            <SafetyNotice note={result?.safetyNote} />
          </div>
        </div>

        <ResearchContext />
      </main>
    </>
  )
}
