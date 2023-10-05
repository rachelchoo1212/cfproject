addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const identityInfo = getIdentityInfo(request);
  const cfAuthorizationHeader = identityInfo['token']
  const url = 'https://rzcftest.cloudflareaccess.com/cdn-cgi/access/get-identity';
  const headers = {
    'Cookie': `CF_Authorization=${cfAuthorizationHeader}`
  };


  const responsePromise = fetch(url, {
    method: 'GET',
    headers: headers
  });

  const response = await Promise.race([responsePromise, timeout(5000)]);

  if (!response) {
    throw new Error('Request timed out');
  }

  if (!response.ok) {
    console.error('Error:', response.status);
    return new Response('Failed to retrieve data', { status: response.status });
  }

  const responseData = await response.json(); // Get the response text
  console.log('Response Body:', responseData);
  //const data = JSON.stringify(responseData, null, 2);
  const userCountry = responseData["geo"]["country"]
  console.log('User Country:', userCountry);
  const country_url = "https://flag.rachel-zhu.com/"+userCountry+".png";
  const currentTimestamp = Date.now();
  const currentTimestampString = new Date(currentTimestamp).toString();
  const result = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication</title>
    </head>
    <body>
      <h1>Hello, World!</h1>
      <p>This is a simple HTML page served by a Cloudflare Worker.</p>
      <p>User {{ variable }} authenticated at {{  timestamp  }}</p>
      <p>From</p>
      <img src ="{{  country_url  }}" width="200">
    </body>
    </html>
  `;
  const finalHtmlContent = result.replace('{{ variable }}', identityInfo['email']).replace('{{  country_url  }}', country_url).replace('{{  timestamp  }}', currentTimestampString);
  //identityInfo['email']+' has been authenticated from '+userCountry;
  return new Response(finalHtmlContent, {
    headers: {
      'Content-Type': 'text/html'
    }
  });
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getIdentityInfo(request) {
  // Implement authentication logic to retrieve user identity information based on the request
  // Replace this with your own logic to fetch the authenticated user's information
  // Example: extract user information from request headers or tokens
  console.log("start")
  const userEmail = request.headers.get('Cf-Access-Authenticated-User-Email');
  const token =  parseCookies(request.headers.get('Cookie'))['CF_Authorization'];
  const userInfo = {

    email: userEmail,
    token: token
  };

  return userInfo;
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.split('=').map(c => c.trim());
    cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {});
}
