import { AzureFunction, Context, HttpRequest } from "@azure/functions"

const TOKEN_API_ENDPOINT = 'https://api.digitallocker.gov.in/public/oauth2/1/token';
const USER_API_ENDPOINT = 'https://api.digitallocker.gov.in/public/oauth2/1/user';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    try {
        context.log('Recieved request for GetAuthToken.....');
        context.log(`Req params: ${req.body}`);
        const params = new URLSearchParams(req.body);
        const client_id = params.get('client_id');
        const code = params.get('code');
        const code_verifier = params.get('code_verifier');
        const grant_type = params.get('grant_type');
        const client_secret = params.get('client_secret'); 

        context.log('Fetching access token.....');
        const accessTokenReq = await fetch(TOKEN_API_ENDPOINT, {
            method: "POST", // *GET, POST, PUT, DELETE, etc.
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id,
                code,
                code_verifier,
                grant_type,
                client_secret,
            }).toString(), // body data type must match "Content-Type" header
        });

        if (accessTokenReq.status < 200 || accessTokenReq.status >= 300) {
            context.res = {
                status: accessTokenReq.status, /* Defaults to 200 */
                body: await accessTokenReq.text()
            };
            return;
        }
        
        const accessTokenResp = await accessTokenReq.json();
        context.log(`accessTokenResp: ${accessTokenResp}`);

        context.log('Fetching user details.....');
        const accessToken = accessTokenResp['access_token'];
        const userDetailsReq = await fetch(USER_API_ENDPOINT, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            mode: 'cors' // needed so that fetch don't auto strip Authorization header
        });

        if (userDetailsReq.status < 200 || userDetailsReq.status >= 300) {
            context.res = {
                status: userDetailsReq.status, /* Defaults to 200 */
                body: await userDetailsReq.text()
            };
            return;
        }
        
        const userDetails = await userDetailsReq.json();
        context.log(`userDetails: ${userDetails}`);
        context.res = {
            status: userDetailsReq.status, /* Defaults to 200 */
            body: userDetails
        };
    } catch (err) {
        context.log(`error: ${err}`);
        context.res = {
            status: 500, /* Defaults to 200 */
            body: err?.message
        };
    }
};

export default httpTrigger;