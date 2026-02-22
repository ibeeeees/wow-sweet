// ============================================================
// SweetReturns — News Injector (Yellow/Purple theme, full panel)
// ============================================================

import { useState, useCallback, useMemo } from 'react';

const ACCENT = '#6a00aa';
const FONT = `'Leckerli One', cursive`;
const BORDER = 'rgba(106,0,170,0.18)';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface SentimentResult {
    sentiment: string;
    score: number;
    affected_tickers?: string[];
    analysis?: string;
    trade_suggestion?: string;
    message?: string;
}

const URL_REGEX = /^https?:\/\//i;

function NewsInjector() {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SentimentResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isUrl = useMemo(() => URL_REGEX.test(input.trim()), [input]);

    const handleInject = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        setIsLoading(true);
        setResult(null);
        setError(null);

        const body = URL_REGEX.test(trimmed)
            ? { news_url: trimmed }
            : { news_text: trimmed };

        try {
            const response = await fetch(`${API_URL}/inject-news`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const data: SentimentResult = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to inject news');
        } finally {
            setIsLoading(false);
        }
    }, [input]);

    const getSentimentColor = (sentiment: string): string => {
        switch (sentiment.toLowerCase()) {
            case 'bullish':
            case 'positive':
                return '#1a7a00';
            case 'bearish':
            case 'negative':
                return '#a30000';
            default:
                return ACCENT;
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: FONT,
        }}>

            {/* Header */}
            <div style={{
                background: '#fff',
                padding: '12px 16px',
                borderBottom: `2px solid rgba(106,0,170,0.2)`,
                flexShrink: 0,
            }}>
                <div style={{ fontSize: 20, color: '#4b0082', fontFamily: FONT }}>
                    News Injector
                </div>
                <div style={{
                    fontSize: 11,
                    color: '#5a3080',
                    marginTop: 4,
                    fontFamily: "'Lobster', cursive",
                    lineHeight: 1.4,
                }}>
                    Put any event in here, we will tell you whatever happens,{' '}
                    <span style={{ color: '#1a7a00', fontWeight: 700 }}>sweet</span> or{' '}
                    <span style={{ color: '#a30000', fontWeight: 700 }}>sour</span>.
                </div>
            </div>

            {/* Body */}
            <div className="sweet-scroll" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
            }}>

                {/* Mode badge */}
                <div style={{
                    fontSize: 10,
                    color: isUrl ? '#005fa3' : '#7a4800',
                    fontFamily: "'Lobster', cursive",
                    background: isUrl ? 'rgba(0,95,163,0.07)' : 'rgba(122,72,0,0.07)',
                    padding: '4px 10px',
                    borderRadius: 20,
                    alignSelf: 'flex-start',
                    border: `1px solid ${isUrl ? 'rgba(0,95,163,0.18)' : 'rgba(122,72,0,0.18)'}`,
                    transition: 'all 0.2s',
                }}>
                    {isUrl ? 'URL detected — Gemini will analyze the article' : 'Paste a URL or type market news below'}
                </div>

                {/* Textarea */}
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="https://cnbc.com/... or paste a headline, rumour, earnings surprise…"
                    disabled={isLoading}
                    rows={5}
                    style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.7)',
                        color: isUrl ? '#005fa3' : '#2d1a00',
                        border: `2px solid ${isUrl ? 'rgba(0,95,163,0.35)' : BORDER}`,
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontFamily: "'Lobster', cursive",
                        fontSize: 12,
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                        opacity: isLoading ? 0.5 : 1,
                        transition: 'border-color 0.2s',
                        boxShadow: 'inset 0 1px 4px rgba(106,0,170,0.06)',
                    }}
                />

                {/* Inject button */}
                <button
                    onClick={handleInject}
                    disabled={isLoading || !input.trim()}
                    style={{
                        padding: '12px 0',
                        background: isLoading || !input.trim()
                            ? 'rgba(106,0,170,0.08)'
                            : '#FFD700',
                        color: isLoading || !input.trim() ? '#9b30d9' : '#3d0066',
                        border: `2px solid ${isLoading || !input.trim() ? 'rgba(106,0,170,0.2)' : 'rgba(106,0,170,0.4)'}`,
                        borderRadius: 8,
                        fontFamily: FONT,
                        fontSize: 16,
                        cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                        transition: 'all 0.18s',
                        boxShadow: isLoading || !input.trim() ? 'none' : '0 2px 8px rgba(255,215,0,0.3)',
                    }}
                >
                    {isLoading
                        ? (isUrl ? 'Analyzing article...' : 'Injecting...')
                        : (isUrl ? 'Analyze with Gemini' : 'Inject News')}
                </button>

                {/* Error */}
                {error && (
                    <div style={{
                        padding: '10px 12px',
                        background: 'rgba(163,0,0,0.06)',
                        border: '1px solid rgba(163,0,0,0.2)',
                        borderRadius: 8,
                        color: '#a30000',
                        fontSize: 11,
                        fontFamily: "'Lobster', cursive",
                    }}>
                        Warning: {error}
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div style={{
                        background: 'rgba(255,255,255,0.6)',
                        border: `1px solid ${BORDER}`,
                        borderRadius: 10,
                        overflow: 'hidden',
                    }}>
                        {/* Sentiment header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 14px',
                            background: 'rgba(255,215,0,0.25)',
                            borderBottom: `1px solid ${BORDER}`,
                        }}>
                            <span style={{ fontSize: 11, color: '#7a4800', fontFamily: "'Lobster', cursive" }}>Sentiment</span>
                            <span style={{
                                fontSize: 14, fontFamily: FONT,
                                color: getSentimentColor(result.sentiment),
                            }}>
                                {result.sentiment} ({result.score >= 0 ? '+' : ''}{result.score.toFixed(2)})
                            </span>
                        </div>

                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {/* Gemini Analysis */}
                            {result.analysis && (
                                <div style={{
                                    padding: '8px 10px',
                                    background: 'rgba(0,95,163,0.06)', borderRadius: 6,
                                    borderLeft: '3px solid rgba(0,95,163,0.4)',
                                }}>
                                    <div style={{ fontSize: 10, color: '#005fa3', fontFamily: FONT, marginBottom: 4 }}>Gemini Analysis</div>
                                    <div style={{ fontSize: 11, color: '#2d1a00', lineHeight: 1.5, fontFamily: "'Lobster', cursive" }}>{result.analysis}</div>
                                </div>
                            )}

                            {/* Trade Suggestion */}
                            {result.trade_suggestion && (
                                <div style={{
                                    padding: '8px 10px',
                                    background: 'rgba(106,0,170,0.06)', borderRadius: 6,
                                    borderLeft: `3px solid ${ACCENT}88`,
                                }}>
                                    <div style={{ fontSize: 10, color: ACCENT, fontFamily: FONT, marginBottom: 4 }}>Trade Signal</div>
                                    <div style={{ fontSize: 11, color: '#2d1a00', lineHeight: 1.5, fontFamily: "'Lobster', cursive" }}>{result.trade_suggestion}</div>
                                </div>
                            )}

                            {/* Affected Tickers */}
                            {result.affected_tickers && result.affected_tickers.length > 0 && (
                                <div>
                                    <div style={{ fontSize: 10, color: '#7a4800', fontFamily: FONT, marginBottom: 6 }}>Affected Tickers</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                        {result.affected_tickers.map((t) => (
                                            <span key={t} style={{
                                                background: 'rgba(106,0,170,0.1)', color: ACCENT,
                                                padding: '3px 8px', borderRadius: 20,
                                                fontSize: 10, fontFamily: FONT,
                                                border: `1px solid rgba(106,0,170,0.2)`,
                                            }}>
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Engine note */}
                            {result.message && (
                                <div style={{ color: '#9b30d9', fontSize: 9, fontStyle: 'italic', fontFamily: "'Lobster', cursive", marginTop: 2 }}>
                                    {result.message}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NewsInjector;
