'use strict';

const Hapi = require('@hapi/hapi');
const convert = require('xml-js');
const Request = require('request-promise');

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost',
        routes: {
            cors: true
        }
    });
    const hapiPgPromise = require('hapi-pg-promise');
    const plugin = {
        plugin: hapiPgPromise,
        options: {
            cn: 'postgres://postgres:123@localhost:5432/hapi_postgresql',
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
        method: 'POST',
        path: '/fetch_elevenia',
        handler: async (request, h) => {
            const payload = request.payload;
            const { uri , apikey } = payload
            const options = { 
                method: 'GET',
                uri: uri,
                headers: 
                 { 'cache-control': 'no-cache',
                   Connection: 'keep-alive',
                   Cookie: 'WMONID=DSoT_3gro_x; JSESSIONID=yx3xd35b1HSfclJyYTB3MJqxQNsm8BZVyJGfZfV2SsLLY6G0n1rk!-2112852246!-1408059603!9602!-1',
                   'Accept-Encoding': 'gzip, deflate',
                   Host: 'api.elevenia.co.id',
                   'Postman-Token': '3149c691-bd40-4d49-a8c0-b51bba89e3bc,b35f4e45-3338-4fa0-a9ae-e19f2d59f2c9',
                   'Cache-Control': 'no-cache',
                    Accept: '*/*',
                   'User-Agent': 'PostmanRuntime/7.19.0',
                   openapikey: apikey,
                   'Content-type': 'application/xml',
                   'Accept-Charset': 'utf-8' 
                  } 
            };              
            let response = await Request.get(options);
            const result = convert.xml2json(response, {compact: true, spaces: 1});
            return result;
 
        }
    });

    server.route({
        method: 'POST',
        path: '/insert_database',
        handler: async (request, h) => {
            const payload = request.payload;
            const { data } = payload
            try{
                data.map(async (key,index) => {
                    const { dispEngNm , dispNm ,
                         parentDispNo , dispNo } = key
                    const setQuery = 'INSERT INTO PRODUCT(product_id,dispengnm,dispnm,parentdispno,created_on,updated_on) \n'+
                    'VALUES(DEFAULT,$1,$2,$3,current_timestamp,current_timestamp);';
                    const result = await request.db.query(setQuery, [ dispEngNm._text, dispNm._text, parentDispNo._text]);
                    return result
                })
                   return {status : 'success'}
            }catch(err){
                return {
                    status : err
                }
            }
        }
    });

     server.route({
        method: ['GET','DELETE','PUT'],
        path: '/product',
        config: {
          handler: async (request, reply) => {
            const { route , payload } = request
            const method = (route.method).toLowerCase()
            let result = undefined
            try{
                if(method === 'get'){
                    result = await request.db.query('SELECT * FROM PRODUCT;', (err, res) => {
                        return reply(res).code(200);
                    });
                }
                if(method === 'delete'){
                    const id = payload.id
                    const result = await request.db.query('DELETE FROM PRODUCT WHERE product_id = $1;',[id]);
                    return { status : 'delete'}
                }
                if(method === 'put'){
                    const { id , dispengnm,
                        dispnm, parentdispno } = payload
                    result = await request.db.query('UPDATE PRODUCT SET dispengnm = $2, dispnm=$3, parentdispno=$4 , updated_on = current_timestamp  WHERE product_id = $1;',
                    [id,dispengnm,dispnm,parentdispno]);
                    return { status : 'update'}
                }
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
