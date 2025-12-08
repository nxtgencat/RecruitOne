'use client'

import React from 'react'

interface MarkdownRendererProps {
    content: string
    className?: string
}

/**
 * Simple Markdown Renderer component that converts basic markdown syntax to HTML
 * Supports: headers (h1-h6), bold, italic, strikethrough, lists, links, inline code, code blocks, blockquotes, horizontal rules
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    if (!content) {
        return <p className="text-muted-foreground">No content available.</p>
    }

    const renderMarkdown = (text: string): React.ReactNode[] => {
        const lines = text.split('\n')
        const elements: React.ReactNode[] = []
        let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null
        let codeBlock: { lang: string; lines: string[] } | null = null
        let blockquoteLines: string[] = []

        const processInline = (line: string): React.ReactNode => {
            // Process inline elements: bold, italic, strikethrough, code, links
            const parts: React.ReactNode[] = []
            let remaining = line
            let key = 0

            while (remaining.length > 0) {
                // Link: [text](url)
                const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/)
                // Inline code: `code`
                const codeMatch = remaining.match(/`([^`]+)`/)
                // Bold: **text** or __text__
                const boldMatch = remaining.match(/\*\*([^*]+)\*\*|__([^_]+)__/)
                // Italic: *text* or _text_
                const italicMatch = remaining.match(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|(?<!_)_(?!_)([^_]+)_(?!_)/)
                // Strikethrough: ~~text~~
                const strikeMatch = remaining.match(/~~([^~]+)~~/)

                // Find the earliest match
                const matches = [
                    { type: 'link', match: linkMatch },
                    { type: 'code', match: codeMatch },
                    { type: 'bold', match: boldMatch },
                    { type: 'italic', match: italicMatch },
                    { type: 'strike', match: strikeMatch },
                ].filter(m => m.match !== null)
                    .sort((a, b) => (a.match?.index || 0) - (b.match?.index || 0))

                if (matches.length === 0) {
                    parts.push(remaining)
                    break
                }

                const first = matches[0]
                const matchObj = first.match!
                const beforeText = remaining.slice(0, matchObj.index)
                if (beforeText) {
                    parts.push(beforeText)
                }

                switch (first.type) {
                    case 'link':
                        parts.push(
                            <a
                                key={key++}
                                href={matchObj[2]}
                                className="text-primary underline hover:no-underline"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {matchObj[1]}
                            </a>
                        )
                        break
                    case 'code':
                        parts.push(
                            <code key={key++} className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">
                                {matchObj[1]}
                            </code>
                        )
                        break
                    case 'bold':
                        parts.push(
                            <strong key={key++} className="font-semibold">
                                {matchObj[1] || matchObj[2]}
                            </strong>
                        )
                        break
                    case 'italic':
                        parts.push(
                            <em key={key++}>
                                {matchObj[1] || matchObj[2]}
                            </em>
                        )
                        break
                    case 'strike':
                        parts.push(
                            <del key={key++} className="line-through">
                                {matchObj[1]}
                            </del>
                        )
                        break
                }

                remaining = remaining.slice((matchObj.index || 0) + matchObj[0].length)
            }

            return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>
        }

        const flushBlockquote = () => {
            if (blockquoteLines.length > 0) {
                elements.push(
                    <blockquote
                        key={elements.length}
                        className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-2"
                    >
                        {blockquoteLines.map((line, i) => (
                            <p key={i}>{processInline(line.replace(/^>\s*/, ''))}</p>
                        ))}
                    </blockquote>
                )
                blockquoteLines = []
            }
        }

        const flushList = () => {
            if (currentList) {
                const ListComponent = currentList.type === 'ul' ? 'ul' : 'ol'
                const listClass = currentList.type === 'ul'
                    ? 'list-disc list-inside space-y-1 my-2'
                    : 'list-decimal list-inside space-y-1 my-2'
                elements.push(
                    <ListComponent key={elements.length} className={listClass}>
                        {currentList.items.map((item, i) => (
                            <li key={i}>{processInline(item)}</li>
                        ))}
                    </ListComponent>
                )
                currentList = null
            }
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            // Code block start/end
            if (line.startsWith('```')) {
                if (codeBlock) {
                    // End code block
                    flushList()
                    flushBlockquote()
                    elements.push(
                        <pre
                            key={elements.length}
                            className="bg-muted p-4 rounded-lg overflow-x-auto my-3 text-sm font-mono"
                        >
                            <code>{codeBlock.lines.join('\n')}</code>
                        </pre>
                    )
                    codeBlock = null
                } else {
                    // Start code block
                    flushList()
                    flushBlockquote()
                    codeBlock = { lang: line.slice(3).trim(), lines: [] }
                }
                continue
            }

            if (codeBlock) {
                codeBlock.lines.push(line)
                continue
            }

            // Empty line
            if (line.trim() === '') {
                flushList()
                flushBlockquote()
                continue
            }

            // Horizontal rule
            if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
                flushList()
                flushBlockquote()
                elements.push(<hr key={elements.length} className="my-4 border-border" />)
                continue
            }

            // Blockquote
            if (line.startsWith('>')) {
                flushList()
                blockquoteLines.push(line)
                continue
            } else {
                flushBlockquote()
            }

            // Headers
            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
            if (headerMatch) {
                flushList()
                const level = headerMatch[1].length
                const text = headerMatch[2]
                const headerClasses: Record<number, string> = {
                    1: 'text-2xl font-bold mt-6 mb-3',
                    2: 'text-xl font-semibold mt-5 mb-2',
                    3: 'text-lg font-semibold mt-4 mb-2',
                    4: 'text-base font-semibold mt-3 mb-1',
                    5: 'text-sm font-semibold mt-2 mb-1',
                    6: 'text-sm font-medium mt-2 mb-1',
                }
                const headerClass = headerClasses[level] || headerClasses[3]
                switch (level) {
                    case 1:
                        elements.push(<h1 key={elements.length} className={headerClass}>{processInline(text)}</h1>)
                        break
                    case 2:
                        elements.push(<h2 key={elements.length} className={headerClass}>{processInline(text)}</h2>)
                        break
                    case 3:
                        elements.push(<h3 key={elements.length} className={headerClass}>{processInline(text)}</h3>)
                        break
                    case 4:
                        elements.push(<h4 key={elements.length} className={headerClass}>{processInline(text)}</h4>)
                        break
                    case 5:
                        elements.push(<h5 key={elements.length} className={headerClass}>{processInline(text)}</h5>)
                        break
                    case 6:
                        elements.push(<h6 key={elements.length} className={headerClass}>{processInline(text)}</h6>)
                        break
                }
                continue
            }


            // Unordered list
            const ulMatch = line.match(/^[\s]*[-*+]\s+(.+)$/)
            if (ulMatch) {
                if (!currentList || currentList.type !== 'ul') {
                    flushList()
                    currentList = { type: 'ul', items: [] }
                }
                currentList.items.push(ulMatch[1])
                continue
            }

            // Ordered list
            const olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/)
            if (olMatch) {
                if (!currentList || currentList.type !== 'ol') {
                    flushList()
                    currentList = { type: 'ol', items: [] }
                }
                currentList.items.push(olMatch[1])
                continue
            }

            // Regular paragraph
            flushList()
            elements.push(
                <p key={elements.length} className="my-2 leading-relaxed">
                    {processInline(line)}
                </p>
            )
        }

        // Flush any remaining items
        flushList()
        flushBlockquote()
        if (codeBlock) {
            elements.push(
                <pre key={elements.length} className="bg-muted p-4 rounded-lg overflow-x-auto my-3 text-sm font-mono">
                    <code>{codeBlock.lines.join('\n')}</code>
                </pre>
            )
        }

        return elements
    }

    return (
        <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
            {renderMarkdown(content)}
        </div>
    )
}
