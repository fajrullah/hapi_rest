'use strict';

const Hapi = require('@hapi/hapi');

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });
    const hapiPgPromise = require('hapi-pg-promise');
    const plugin = {
        plugin: hapiPgPromise,
        options: {
            cn: 'postgres://test:123@localhost:5432/hapi_postgresql',
        }
    };

    await server.register(plugin);
    
    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            return 'Hello World!';
        }
    });

     server.route({
        method: 'GET',
        path: '/data',
        config: {
          handler: async (request, reply) => {
            try{
                const result = await request.db.query('SELECT * FROM ACCOUNT;', (err, res) => {
                    
                    if (err) {
                        return reply(err).code(500);
                        }

                    if (!res) {
                        return reply('not found').code(404);
                        }

                    return reply(res).code(200);
                  });

                return result

            }catch(err){

                return {
                    status : err
                }
            }
            
          }
        }
      });

      await server.start();

      console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
