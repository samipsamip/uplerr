import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './auth'

const app = new Hono()

app.use('/api/auth/*', cors({
  origin: "http://localhost:5173",
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.get('/', (c) => {
  return c.text('Hello Hono!')
})


serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
