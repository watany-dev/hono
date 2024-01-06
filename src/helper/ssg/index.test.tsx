import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
import { describe, it, expect } from 'vitest'
import { Hono } from '../../hono'
import { jsx } from '../../jsx'
import { ssgRoute, toSsg } from './index'

describe('toSsg function', () => {
  it('Should correctly generate static HTML files for Hono routes', async () => {
    const app = new Hono()
    app.get('/', ssgRoute(), (c) => c.text('Hello, World!'))
    app.get('/about', ssgRoute(), (c) => c.text('About Page'))
    app.get('/about/some', ssgRoute(), (c) => c.text('About Page 2tier'))
    app.post('/about/some/thing', ssgRoute(), (c) => c.text('About Page 3tier'))
    app.get('/bravo', ssgRoute(), (c) => c.html('Bravo Page'))
    app.get('/Charlie', ssgRoute(), async (c, next) => {
      c.setRenderer((content, head) => {
        return c.html(
          <html>
            <head>
              <title>{head.title || ''}</title>
            </head>
            <body>
              <p>{content}</p>
            </body>
          </html>
        )
      })
      await next()
    })
    app.get('/Charlie', ssgRoute(), (c) => {
      return c.render('Hello!', { title: 'Charlies Page' })
    })
    app.get('/posts/:id', ssgRoute(() => {
      const result = []
      for (let i = 0; i !== 10; i ++) {
        result.push({
          id: i.toString()
        })
      }
      return result
    }), c => c.text(`Post ${c.req.param('id')}`))

    const fsMock = {
      writeFile: vitest.fn((path, data) => {
        console.log(`writeFile called with path: ${path}, data: ${data}`)
        return Promise.resolve()
      }),
      mkdir: vitest.fn((path, options) => {
        console.log(`mkdir called with path: ${path}, options: ${JSON.stringify(options)}`)
        return Promise.resolve()
      }),
    }

    await toSsg(app, fsMock)

    expect(fsMock.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true })
    expect(fsMock.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('Hello, World!')
    )
    expect(fsMock.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('About Page')
    )

    expect(fsMock.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('<title>Charlies Page</title>')
    )
  })
})
