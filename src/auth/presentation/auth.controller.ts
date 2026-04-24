import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { SupabaseAuthRepository } from '../infrastructure/supabase-auth.repository';
import { LoginAuthUseCase } from '../application/use-cases/login-auth.usecase';
import { LoginDto } from '../application/dto/in/login.dto';

const repository = new SupabaseAuthRepository();
const loginUseCase = new LoginAuthUseCase(repository);

export async function authControllerPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dto = new LoginDto(request.body);
      const session = await loginUseCase.execute(dto);
      return reply.code(200).send(session);
    } catch (error: any) {
      return reply.code(401).send({ error: error.message });
    }
  });
}
