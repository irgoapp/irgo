import { FastifyRequest, FastifyReply } from 'fastify';

export async function jwtMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const token = request.headers.authorization;
  if (!token) {
    return reply.code(401).send({ error: 'Token requerido' });
  }
  // Lógica de verificación JWT...
}
