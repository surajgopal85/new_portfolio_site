import test from 'node:test'
import assert from 'node:assert/strict'
import { readingMinutes, renderMarkdown, slugifyHeading } from './markdown.ts'

test('a paragraph joins its lines', () => {
  assert.equal(renderMarkdown('one\ntwo'), '<p>one two</p>')
})

test('blank lines separate paragraphs', () => {
  assert.equal(renderMarkdown('one\n\ntwo'), '<p>one</p>\n<p>two</p>')
})

test('# is h2, because the page owns the h1', () => {
  assert.equal(renderMarkdown('# Title'), '<h2 id="title">Title</h2>')
  assert.equal(renderMarkdown('## Sub'), '<h3 id="sub">Sub</h3>')
})

test('headings never go past h6', () => {
  assert.equal(renderMarkdown('###### Deep'), '<h6 id="deep">Deep</h6>')
})

test('bullets and numbers make separate lists', () => {
  assert.equal(renderMarkdown('- a\n- b'), '<ul><li>a</li><li>b</li></ul>')
  assert.equal(renderMarkdown('1. a\n2. b'), '<ol><li>a</li><li>b</li></ol>')
  assert.equal(
    renderMarkdown('- a\n1. b'),
    '<ul><li>a</li></ul>\n<ol><li>b</li></ol>',
    'a bullet run and a number run must not merge',
  )
})

test('a fenced block keeps its text verbatim and carries its language', () => {
  const html = renderMarkdown('```python\nif x < 1 & y:\n    pass\n```')
  assert.equal(html, '<pre><code class="language-python">if x &lt; 1 &amp; y:\n    pass\n</code></pre>')
})

test('an unclosed fence still terminates', () => {
  assert.equal(renderMarkdown('```\nhanging'), '<pre><code>hanging\n</code></pre>')
})

test('markdown inside a code span stays literal', () => {
  assert.equal(renderMarkdown('`**not bold**`'), '<p><code>**not bold**</code></p>')
})

test('emphasis is asterisks only, so identifiers survive', () => {
  assert.equal(renderMarkdown('**b** and *i*'), '<p><strong>b</strong> and <em>i</em></p>')
  assert.equal(renderMarkdown('stripe_payment_id'), '<p>stripe_payment_id</p>')
})

test('external links open in a new tab, internal ones do not', () => {
  assert.equal(
    renderMarkdown('[x](https://example.com)'),
    '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">x</a></p>',
  )
  assert.equal(renderMarkdown('[x](/projects/)'), '<p><a href="/projects/">x</a></p>')
})

test('a link target that is not a URL renders as text, not an href', () => {
  for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'nonsense']) {
    const html = renderMarkdown(`[x](${bad})`)
    assert.ok(!html.includes('<a '), `${bad} became a link`)
  }
})

test('raw HTML in a post is escaped, never passed through', () => {
  assert.equal(
    renderMarkdown('<script>alert(1)</script>'),
    '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
  )
})

test('block quotes and rules', () => {
  assert.equal(renderMarkdown('> quoted\n> still'), '<blockquote><p>quoted still</p></blockquote>')
  assert.equal(renderMarkdown('---'), '<hr />')
})

test('a dash list is not mistaken for a rule', () => {
  assert.equal(renderMarkdown('- item'), '<ul><li>item</li></ul>')
})

test('heading slugs are url-safe and collapse punctuation', () => {
  assert.equal(slugifyHeading('When *not* to use an LLM?'), 'when-not-to-use-an-llm')
  assert.equal(slugifyHeading('`match_by_spi`'), 'match-by-spi')
})

test('reading time rounds up and is never zero', () => {
  assert.equal(readingMinutes(''), 1)
  assert.equal(readingMinutes('word '.repeat(600)), 3)
})

test('a hard-wrapped list item continues instead of ending the list', () => {
  assert.equal(
    renderMarkdown('- first line\n  wrapped on\n- second'),
    '<ul><li>first line wrapped on</li><li>second</li></ul>',
  )
})
