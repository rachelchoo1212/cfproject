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
  const resquest_url = new URL(request.url);
  const path = resquest_url.pathname;
  if (path != '/secure'){
    const countryname = path.slice(-2);
    const country_url = "https://flag.rachel-zhu.com/"+countryname+".png";
    try {
      const response = await fetch(country_url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
  
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (error) {
      return new Response(`Error fetching the file: ${error.message}`, { status: 500 });
    }

  }

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
  const country_url = "https://tunnle.rachel-zhu.com/secure"+userCountry;
  const currentTimestamp = Date.now();
  const currentTimestampString = new Date(currentTimestamp).toString();
  const useremail =identityInfo['email'];
  const result = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication</title>
    </head>
    <body>
      <h1>Hello, World!</h1>
      <p>This is a simple HTML page served by a Cloudflare Worker.</p>
      <p>User ${useremail} authenticated </p>
      <p>At: ${currentTimestampString}</p>
      <p style="display: inline;">From: <a href="https://tunnel.rachel-zhu.com/secure/${userCountry}" target="_blank">${userCountry}</a></p>
    </body>
    </html>
  `;
  return new Response(result, {
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
