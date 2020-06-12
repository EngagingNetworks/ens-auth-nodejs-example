# ENS Authentication Server Example in Node JS

A Node JS webserver that uses a private token to authenticate with Engaging Networks Services (ENS) and obtain a temporary token. This temporary token can be used to make futher ENS calls such as POSTing transactions.

## Important security information
* **This is an example application**. It is intended as a guide or starting point. Although it does require HTTPS, it hasn't been tested for security vulnerabilities.
* The API user associated with the private token **must not** have any supporter data permissions. The temporary token will be freely available to anyone who can visit the domain pointed to the server.
* Don't share your private token with anyone. If you suspect it has been compromised, revoke it in Engaging Networks immediately.

## Setup
1. Install a recent version of Node JS on your server
2. Download this package to a directory containing your SSL certificate and key
3. Run *npm install* to install the required node modules
3. Update the .env file (see below)
4. Point your domain/path to localhost:{PORT}, where {PORT} is what you've configured in the .env file (see below)
5. Whitelist the IP address of your server in Engaging Networks on your ENS user

### .env file
You'll need to update the following information in the *.env* file
* PRIVATE_TOKEN: your private token from your Engaging Networks ENS user
* SSL_CERT_FILE: the file name an extension of your SSL **certificate** file
* SSL_KEY_FILE: the file name an extension of your SSL **key** file
* ENS_DOMAIN: the Engaging Networks domain to point to. e.g. us.e-activist.com. **Default: e-activist.com**
* PORT: the port on localhost from which to serve. **Default: 8080**
* TOKENPATH: the path the token will be accessible at. **Default: ensauth e.g. https://localhost:8080/ensauth**

## Starting the server

Run *npm run start* to start the server. It will start running on localhost on the port you specify.

### Development

You can run *npm run devstart* to start the server using the "nodemon" package. This will restart the server every time you make a change to JS or JSON files, as an aid to development work.

## How it works

When the server receives a request for the first time, it will try to authenticate to ENS using the private token. If successful, it will receive a temporary authentication token from the ENS API and store it. The server will then respond to the original request with the token and an expiry timestamp.

If a valid temporary token has already been stored and is still valid, it will respond with that. If not, it will try to authenticate to ENS again and get another token.

## How to use the temporary token

The temporary token can be used to make other ENS calls. For example, processing a page transaction at /ens/service/page/{somePageId}/process. Unlike other ENS calls, IP restrictions are disabled for this particular service and therefore it can be called from the browser via AJAX.

Please see the ENS documentation for more details.
https://engagingnetworks.support/knowledge-base/engaging-networks-services-ens/