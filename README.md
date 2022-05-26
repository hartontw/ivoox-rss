# Ivoox RSS

## Instalation
```sh
git clone https://github.com/hartontw/ivoox-rss.git
cd ivoox-rss
npm install
```

## Usage
```sh
npm start
```

## Configuration

### Envs

```HOST``` default *localhost*
```PORT``` default *3000*

Is possible create a file called ```.env``` in the root directory (same level as this README).

Example:

```
HOST=192.168.1.10
PORT=4000
``` 

### Feeds

Create a file named ```feeds.json``` in the root directory (same level as this README).

Example:

```json
{
    "Astrobitacora": {
        "url": "https://www.ivoox.com/feed_fg_f1742945_filtro_1.xml",
        "redirects": 5
    }
}
```

The seek functionalitty is not working. The field ```redirects``` is for redirect the last ```x``` episodes to enable seeking for those at least. High values in this field implies longer response time.