export default defineEventHandler((event) => {
  const protectedPath = [
    '/api/chat',
    '/api/createVecStore',
    '/api/deleteVector',
    '/api/queryVector'
  ]

  if (protectedPath.includes(getRequestURL(event).pathname)) {
    if (!event.node.req.headers['x-openai-key']?.toString().includes('sk-'))
      return createError('Missing Open AI key')
  }
})
