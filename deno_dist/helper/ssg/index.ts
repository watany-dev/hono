import { Buffer } from "node:buffer";
import * as path from 'node:path'
import type { Env, Schema } from '../../index.ts'
import { replaceUrlParam } from '../../client/utils.ts'
import { inspectRoutes } from '../../helper/dev/index.ts'
import type { Hono } from '../../hono.ts'
import { createMiddleware } from '../factory/index.ts'

interface FileSystemModule {
  writeFile(path: string, data: string | Buffer): Promise<void>
  mkdir(path: string, options: { recursive: boolean }): Promise<void>
}

const generateFilePath = (routePath: string) => {
  const fileName = routePath === '/' ? 'index.html' : routePath + '.html'
  return path.join('./static', fileName)
}

export type GeneratedStaticPaths = Record<string, string>[]
export type GenerateStaticPaths = () => GeneratedStaticPaths | Promise<GeneratedStaticPaths>

/**
 * For define SSG route
 */
export const ssgRoute = (generateStaticPaths?: GenerateStaticPaths) => createMiddleware(async (c, next) => {
  if (!generateStaticPaths) {
    generateStaticPaths = () => [{}]
  }
  const staticPaths = await generateStaticPaths()
  c.header('x-hono-ssg', JSON.stringify(staticPaths))
  await next()
})

export const toSsg = async <
  E extends Env = Env,
  S extends Schema = {},
  BasePath extends string = '/'
>(
  app: Hono<E, S, BasePath>,
  fsModule: FileSystemModule
) => {
  const baseURL = 'http://localhost'

  for (const route of inspectRoutes(app)) {
    if (route.isMiddleware) continue

    const url = new URL(route.path, baseURL).toString()
    const response = await app.fetch(new Request(url))
    const forHonoSsgHeaderData = response.headers.get('x-hono-ssg')
    if (!forHonoSsgHeaderData) {
      continue
    }
    const staticPaths: Record<string, string>[] = JSON.parse(forHonoSsgHeaderData)
    for (const staticPath of staticPaths) {
      const replacedUrl = replaceUrlParam(route.path, staticPath)
      const pageRes = await app.request(new URL(replacedUrl, baseURL).href)
      const html = await pageRes.text()

      const filePath = generateFilePath(replacedUrl)
      const dirPath = path.dirname(filePath)
      await fsModule.mkdir(dirPath, { recursive: true })
      await fsModule.writeFile(filePath, html)
      console.log(`File written: ${filePath}`)

    }
  }
  console.log('Static site generation completed.')
}
