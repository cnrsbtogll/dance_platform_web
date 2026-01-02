import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

const root = createRoot(rootElement)

// Not: React StrictMode, geliştirme ortamında bileşenlerin iki kez render edilmesine neden olur.
// Bu, yan etkileri ve potansiyel problemleri tespit etmek için normal bir davranıştır ve
// prodüksiyon ortamında oluşmaz. Çift render davranışlarını görmek istemiyorsanız,
// StrictMode'u geçici olarak kaldırabilirsiniz (<App /> şeklinde).
root.render(
  <App />
)
