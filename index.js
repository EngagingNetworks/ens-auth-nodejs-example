

// getting .env variables
require('dotenv').config()
// manipulating files
const fs = require('fs')
// actual server
const https = require('https')
// path tools for working with the URL
const path = require('path')

/**

	Server

**/

function start(config = {}){

	const PRIVATE_TOKEN = config.PRIVATE_TOKEN || process.env.PRIVATE_TOKEN
	const SSL_CERT_FILE = config.SSL_CERT_FILE || process.env.SSL_CERT_FILE
	const SSL_KEY_FILE = config.SSL_KEY_FILE || process.env.SSL_KEY_FILE
	const ENS_DOMAIN = config.ENS_DOMAIN || process.env.ENS_DOMAIN
	const PORT = config.PORT || process.env.PORT
	const TOKENPATH = config.TOKENPATH || process.env.TOKENPATH

	let temporaryToken, expiryTime

	// start up our server
	const server = https.createServer(
		// load HTTPS cert and key
		{
			key: fs.readFileSync(SSL_KEY_FILE),
			cert: fs.readFileSync(SSL_CERT_FILE)
		},
		async (request, response) => {

			// is it our specified tokenpath?
			if(request.url != '/' + TOKENPATH){
				response.end()
				return
			}


			// headers, including cors required ones
			const responseHeaders = {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': request.headers.origin || '*',
				'Access-Control-Allow-Methods': 'OPTIONS, GET',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Max-Age': 2592000, // 30 days
			}

			// it's a cors pre-flight request
			if(request.method == 'OPTIONS'){
				response.writeHead(204, responseHeaders)
				response.end()
				return
			}

			try {

				// do we have a temporary token yet? if so, has it expired?
				if(!temporaryToken || Date.now() > expiryTime){

					// lets authenticate again
					let { newTemporaryToken, timeToLive } = await authenticateToENS(PRIVATE_TOKEN, ENS_DOMAIN)

					// set new expiry time of time to live minus 10 minutes (just to be safe)
					expiryTime = Date.now() + (timeToLive - 600000)
					// store token for reuse
					temporaryToken = newTemporaryToken
				}

				// always JSON
				response.writeHead(200, responseHeaders)
				response.write(JSON.stringify({
					expires: expiryTime,
					token: temporaryToken
				}))

				response.end()

			}

			catch(err){

				console.log('Error: ' + err)
				response.writeHead(500)
				response.end()

			}

		}
	)


	// listening on localhost:{port}
	server.listen(PORT, () => {

		console.log(`Server started at https://localhost:${PORT}`)
		console.log(`ENS tokens available at /${TOKENPATH}`)

	})

	return server

}

/**

	Authenticate to ENS

**/

const authenticateToENS = (privateToken, domain) => {

	return new Promise((pResolve, pReject) => {

		console.log('Authenticating to ENS')

		const options = {
			hostname: domain,
			path: '/ens/service/authenticate',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		}

		// make our request
		const req = https.request(options, (res) => {

			if(res.statusCode !== 200){
				pReject('wrong status code')
				return				
			}

			// collect chunks of data
			let data = ''

			res.on('data', (d) => {

				data += d

			})

			// try and turn it in to JSON and extract temporary token and timer
			res.on('end', () => {

				try {

					const parsed = JSON.parse(data)

					pResolve({
						newTemporaryToken: parsed['ens-auth-token'],
						timeToLive: parsed.expires
					})

				}

				catch(err){

					pReject(err)

				}
				

			})

		})

		req.on('error', (error) => {

			console.log('ens error', error)
			pReject('Can\t connect to ENS:' + err)

		})

		req.write(privateToken)
		req.end()

	})

}


exports.start = start