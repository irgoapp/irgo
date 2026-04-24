import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { ActualizarUbicacionDto } from '../application/dto/in/actualizar-ubicacion.dto';
import { ConductorResponseDto } from '../application/dto/out/conductor-response.dto';
import { ActualizarUbicacionConductorUseCase } from '../application/use-cases/actualizar-ubicacion-conductor.usecase';
import { ConsultarHistorialConductorUseCase } from '../application/use-cases/consultar-historial-conductor.usecase';
import { ObtenerUbicacionConductorUseCase } from '../application/use-cases/obtener-ubicacion-conductor.usecase';
import { CambiarDisponibilidadConductorUseCase } from '../application/use-cases/cambiar-disponibilidad-conductor.usecase';
import { SupabaseConductorRepository } from '../infrastructure/supabase-conductor.repository';
import { SupabaseViajeRepository } from '../../viaje/infrastructure/supabase-viaje.repository';

// Instancias
const repository = new SupabaseConductorRepository();
const viajeRepository = new SupabaseViajeRepository();
const actualizarUbicacionUseCase = new ActualizarUbicacionConductorUseCase(repository);
const consultarHistorialUseCase = new ConsultarHistorialConductorUseCase(viajeRepository);
const obtenerUbicacionUseCase = new ObtenerUbicacionConductorUseCase(repository);
const cambiarDisponibilidadUseCase = new CambiarDisponibilidadConductorUseCase(repository);

export async function conductorControllerPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.put('/:id/ubicacion', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const dto = new ActualizarUbicacionDto({ conductor_id: request.params.id, ...(request.body as any) });
      const resultado = await actualizarUbicacionUseCase.execute(dto);
      return reply.code(200).send(resultado);
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  fastify.get('/:id/ubicacion', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const ubicacion = await obtenerUbicacionUseCase.execute(request.params.id);
      if (!ubicacion) return reply.code(404).send({ error: 'Ubicación no disponible' });
      return reply.code(200).send(ubicacion);
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  // Endpoint GET para obtener el historial limpio
  fastify.get('/:id/historial', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const historial = await consultarHistorialUseCase.execute(request.params.id);
      return reply.code(200).send(historial);
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  fastify.put('/:id/disponibilidad', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      const disponible = body.disponible === true || 
                        body.disponible === 'true' || 
                        body.disponible === 1;

      await cambiarDisponibilidadUseCase.execute({ 
        conductor_id: request.params.id, 
        disponible 
      });

      return reply.code(200).send({ ok: true, disponible });
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });
}
