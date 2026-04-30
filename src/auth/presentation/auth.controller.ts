import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { SupabaseAuthRepository } from '../infrastructure/supabase-auth.repository';
import { LoginAuthUseCase } from '../application/use-cases/login-auth.usecase';
import { LoginDto } from '../application/dto/in/login.dto';
import { supabaseClient } from '../../shared/supabase.client';

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

  // GET /api/auth/verificar
  // Valida el token JWT del conductor contra Supabase
  fastify.get('/verificar', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Token requerido' });
      }
      
      const token = authHeader.replace('Bearer ', '');
      
      const { data, error } = await supabaseClient.auth.getUser(token);
      
      if (error || !data.user) {
        return reply.code(401).send({ error: 'Token inválido' });
      }
      
      return reply.code(200).send({ 
        ok: true, 
        conductor_id: data.user.id 
      });
    } catch (error: any) {
      return reply.code(401).send({ error: 'Token inválido' });
    }
  });
}
