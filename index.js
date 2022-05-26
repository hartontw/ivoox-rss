require('dotenv').config();
const http = require('http');
const path = require('path');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const feeds = require(path.join(__dirname, 'feeds.json'));

const server = http.createServer(serverListener);

// Ranges not working
async function startAudioStream(res, range, code) {
 
    const response = await fetch(`http://ivoox.com/listen_mn_${code}_1.mp3`);
    
    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);

    const total = parseInt(response.headers.get('content-length'), 10);

    const head = {
        'Content-Type': 'audio/mp3',
        'Accept-Ranges': 'bytes', 
        'Content-Length': total-1
    };
     
    if (range) {      
        const start = parseInt(range.replace(/bytes=/, "").split("-")[0], 10);
        const end = total-1;
        const chunksize = (end-start)+1;
        head['Content-Length'] = chunksize;
        head['Content-Range'] = `bytes ${start}-${end}/${total}`;        
        res.writeHead(206, head);
    }
    else {
        res.writeHead(200, head);
    }

   response.body.pipe(res);
}

async function getSecureLink(code) {
    const listen = await fetch(`http://ivoox.com/listen_mn_${code}_1.mp3`, { redirect: 'manual' });
    if (listen.status === 301 || listen.status === 302) {
        const locationURL = new URL(listen.headers.get('location'), listen.url);
        const secure = await fetch(locationURL, { redirect: 'manual' });
        return secure.headers ? secure.headers.get('location') : undefined;
    }
}

async function getRSS(res, name) {
    const feed = feeds[name];
    if (!feed) {
        return res.end(`Feed ${name} not found`);
    }

    const response = await fetch(feed.url);

    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);

    let rss = await response.text();

    const reg = /<enclosure url="[^_]+_mf_([0-9]+)[^"]+"/g; ///<enclosure url="[^_]+_mf_([^_]+)[^"]+"/g

    let count = 0, result;
    while((result = reg.exec(rss)) !== null) {
        const code = result[1];
        if (code) {
            let replacement = `<enclosure url="http://${HOST}:${PORT}/${name}/${code}"`;
            if (count < feed.links) {
                const secureUrl = await getSecureLink(code);
                if (secureUrl) {
                    replacement = `<enclosure url="${secureUrl}"`;
                }
                count++;
            }
            rss = rss.replace(result[0], replacement);
        }
    }    

    res.end(rss);
}

function writeFeeds(res) {    
    res.write(`<h1>FEEDS</h1>`);
    for(let feed of Object.keys(feeds)) {
        const link = `http://${HOST}:${PORT}/${feed}`;
        res.write(`<a href="${link}">${link}</a>`);
    };
    res.end();
}

async function serverListener(req, res) {
    try {
        const dir = req.url.match(/^\/([^/]+)\/?([^/]*)/);
        if (dir) {
            if (dir[2]) {
                await startAudioStream(res, req.headers.range, dir[2]);
            }
            else {
                await getRSS(res, dir[1]);
            }
        }
        else {
            writeFeeds(res);
        }
    }
    catch(error) {
        console.error(error);
        res.write(error.message);
        res.end();
    }
}

server.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});